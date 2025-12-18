import type { LeBotClient } from "@class/LeBotClient";
import { BotEvents } from "@enums/BotEvents";
import { Point } from "@influxdata/influxdb-client";
import { InfluxService } from "@services/InfluxService";
import { prismaClient } from "@services/prismaService";
import { RedisService } from "@services/RedisService";
import { Logger } from "@utils/Logger";
import { StatsReader } from "./StatsReader";

// Flush behavior tuning
const FLUSH_DEBOUNCE_MS = 1000; // flush up to 1s after last write
const FLUSH_FORCE_INTERVAL_MS = 5000; // force flush if no flush for 5s

export class StatsWriter {
	private static logger = new Logger("StatsWriter");
	private static lastFlush = 0;
	private static flushTimer: ReturnType<typeof setTimeout> | null = null;
	private static pendingUserInvalidations = new Set<string>(); // format: userId|guildId
	private static messageBuffer = new Map<string, number>();

	private static scheduleFlush() {
		const now = Date.now();
		// Force immediate flush if exceeded force interval
		if (now - this.lastFlush > FLUSH_FORCE_INTERVAL_MS) {
			void this.performFlush();
			return;
		}
		if (this.flushTimer) {
			clearTimeout(this.flushTimer);
		}
		this.flushTimer = setTimeout(
			() => void this.performFlush(),
			FLUSH_DEBOUNCE_MS,
		);
	}

	private static async performFlush() {
		if (this.flushTimer) {
			clearTimeout(this.flushTimer);
			this.flushTimer = null;
		}

		// Flush aggregated messages
		if (this.messageBuffer.size > 0) {
			const now = new Date();
			for (const [key, count] of this.messageBuffer) {
				const [userId, channelId, guildId] = key.split("|");
				if (userId && channelId && guildId) {
					const point = new Point("message_activity")
						.tag("userId", userId)
						.tag("channelId", channelId)
						.tag("guildId", guildId)
						.intField("count", count)
						.timestamp(now);
					InfluxService.writePoint(point);
				}
			}
			this.messageBuffer.clear();
		}

		try {
			await InfluxService.flush();
			this.lastFlush = Date.now();
			// Invalidate user caches whose data was just flushed
			if (this.pendingUserInvalidations.size) {
				for (const key of this.pendingUserInvalidations) {
					const parts = key.split("|");
					const userId = parts[0]!;
					const guildId = parts[1]!;
					if (!userId || !guildId) continue; // safety guard
					await StatsReader.invalidateUserCache(userId, guildId);
				}
				this.pendingUserInvalidations.clear();
			}
		} catch (err) {
			this.logger.error(
				"Failed to flush Influx writes",
				err instanceof Error ? err.stack : String(err),
			);
		}
	}

	// Voice Activity Tracking
	static async startVoiceSession(
		userId: string,
		channelId: string,
		guildId: string,
	): Promise<void> {
		const redis = RedisService.getInstance();
		const sessionId = `${userId}-${channelId}-${Date.now()}`;
		const sessionKey = `voice:session:${userId}:${channelId}`;
		const startTime = Date.now();
		const lastTickTime = startTime;

		// Store session start in Redis (include lastTickTime & guildId for incremental ticks)
		await redis.set(
			sessionKey,
			JSON.stringify({ sessionId, startTime, lastTickTime, guildId }),
			"EX",
			86400,
		); // 24h

		this.logger.log(`Voice session started: ${userId} in ${channelId}`);
	}

	static async endVoiceSession(
		client: LeBotClient,
		userId: string,
		channelId: string,
		guildId: string,
	): Promise<void> {
		const redis = RedisService.getInstance();
		const sessionKey = `voice:session:${userId}:${channelId}`;
		const sessionData = await redis.get(sessionKey);

		if (sessionData) {
			const { sessionId, lastTickTime } = JSON.parse(sessionData);
			const endTime = Date.now();
			const remainingDuration = Math.floor(
				(endTime - lastTickTime) / 1000,
			); // seconds since last tick
			if (remainingDuration > 0) {
				const point = new Point("voice_activity")
					.tag("userId", userId)
					.tag("channelId", channelId)
					.tag("guildId", guildId)
					.tag("sessionId", sessionId)
					.intField("duration", remainingDuration)
					.timestamp(new Date(lastTickTime));
				InfluxService.writePoint(point);

				// Update SQL UserStats
				await prismaClient.userStats.upsert({
					where: { userId_guildId: { userId, guildId } },
					update: { voiceDuration: { increment: remainingDuration } },
					create: {
						userId,
						guildId,
						voiceDuration: remainingDuration,
					},
				});

				client.emit(BotEvents.StatsUpdated, {
					userId,
					guildId,
					type: "voice",
				});
			}
			await redis.del(sessionKey);
			this.pendingUserInvalidations.add(`${userId}|${guildId}`);
			this.scheduleFlush();
			this.logger.log(
				`Voice session ended: ${userId} in ${channelId} (final +${remainingDuration}s)`,
			);
		}
	}

	// Incremental per-minute recording of ongoing voice sessions
	static async tickActiveVoiceSessions(
		client: LeBotClient<boolean>,
	): Promise<void> {
		const redis = RedisService.getInstance();
		const pattern = "voice:session:*";
		const keys = await redis.keys(pattern);
		const now = Date.now();
		let updated = 0;
		for (const key of keys) {
			const data = await redis.get(key);
			if (!data) continue;
			try {
				const { sessionId, startTime, lastTickTime, guildId } =
					JSON.parse(data);
				const parts = key.split(":");
				const userId = parts[2];
				const channelId = parts[3];
				if (!userId || !channelId || !guildId) continue;

				// Verify if the user is still in the voice channel
				const guild = client.guilds.cache.get(guildId);
				if (!guild) {
					// Guild not found, cleanup session
					await redis.del(key);
					continue;
				}
				const voiceState = guild.voiceStates.cache.get(userId);
				if (!voiceState || voiceState.channelId !== channelId) {
					// User not in voice or in different channel - zombie session
					await redis.del(key);
					continue;
				}

				const elapsedSeconds = Math.floor((now - lastTickTime) / 1000);
				if (elapsedSeconds < 60) continue; // only record if at least a minute elapsed
				const point = new Point("voice_activity")
					.tag("userId", userId)
					.tag("channelId", channelId)
					.tag("guildId", guildId)
					.tag("sessionId", sessionId)
					.intField("duration", elapsedSeconds)
					.timestamp(new Date(lastTickTime));
				InfluxService.writePoint(point);

				// Update SQL UserStats
				await prismaClient.userStats.upsert({
					where: { userId_guildId: { userId, guildId } },
					update: { voiceDuration: { increment: elapsedSeconds } },
					create: { userId, guildId, voiceDuration: elapsedSeconds },
				});

				client.emit(BotEvents.StatsUpdated, {
					userId,
					guildId,
					type: "voice",
				});

				await redis.set(
					key,
					JSON.stringify({
						sessionId,
						startTime,
						lastTickTime: now,
						guildId,
					}),
					"EX",
					86400,
				);
				this.pendingUserInvalidations.add(`${userId}|${guildId}`);
				updated++;
			} catch (err) {
				this.logger.error(
					`Failed ticking session ${key}:`,
					err instanceof Error ? err.message : String(err),
				);
			}
		}
		if (updated > 0) {
			this.scheduleFlush();
			this.logger.log(`Ticked ${updated} voice sessions`);
		}
	}

	// Message Activity Tracking
	static async recordMessage(
		client: LeBotClient,
		userId: string,
		channelId: string,
		guildId: string,
	): Promise<void> {
		const key = `${userId}|${channelId}|${guildId}`;
		this.messageBuffer.set(key, (this.messageBuffer.get(key) || 0) + 1);

		// Update SQL UserStats
		await prismaClient.userStats.upsert({
			where: { userId_guildId: { userId, guildId } },
			update: { messageCount: { increment: 1 } },
			create: { userId, guildId, messageCount: 1 },
		});

		// Update Redis for sliding window (1h)
		const redis = RedisService.getInstance();
		const redisKey = `stats:msg_1h:${guildId}:${userId}`;
		const now = Date.now();
		const oneHourAgo = now - 3600 * 1000;

		// Use timestamp as score and member to ensure uniqueness
		await redis.zadd(redisKey, now, `${now}`);
		await redis.zremrangebyscore(redisKey, 0, oneHourAgo);
		await redis.expire(redisKey, 3600); // Expire if inactive

		client.emit(BotEvents.StatsUpdated, {
			userId,
			guildId,
			type: "message",
		});

		// Track user for cache invalidation after flush
		this.pendingUserInvalidations.add(`${userId}|${guildId}`);
		this.scheduleFlush();
	}

	// Invite Activity Tracking
	static async incrementInviteCount(
		client: LeBotClient,
		userId: string,
		guildId: string,
	): Promise<void> {
		// Update SQL UserStats
		await prismaClient.userStats.upsert({
			where: { userId_guildId: { userId, guildId } },
			update: { inviteCount: { increment: 1 } },
			create: { userId, guildId, inviteCount: 1 },
		});

		client.emit(BotEvents.StatsUpdated, {
			userId,
			guildId,
			type: "invite",
		});

		// Track user for cache invalidation
		this.pendingUserInvalidations.add(`${userId}|${guildId}`);
	}

	// Server Activity Tracking
	static async recordJoin(userId: string, guildId: string): Promise<void> {
		const point = new Point("server_activity")
			.tag("userId", userId)
			.tag("guildId", guildId)
			.tag("action", "JOIN")
			.intField("value", 1)
			.timestamp(new Date());

		InfluxService.writePoint(point);
		await InfluxService.flush();
		await StatsReader.invalidateServerCache(guildId);
	}

	static async recordLeave(userId: string, guildId: string): Promise<void> {
		const point = new Point("server_activity")
			.tag("userId", userId)
			.tag("guildId", guildId)
			.tag("action", "LEAVE")
			.intField("value", 1)
			.timestamp(new Date());

		InfluxService.writePoint(point);
		await InfluxService.flush();
		await StatsReader.invalidateServerCache(guildId);
	}

	// Cleanup abandoned sessions (run periodically)
	static async cleanupAbandonedSessions(): Promise<void> {
		const redis = RedisService.getInstance();
		const pattern = "voice:session:*";
		const keys = await redis.keys(pattern);
		let cleaned = 0;

		const threshold = Date.now() - 24 * 60 * 60 * 1000; // 24h ago

		for (const key of keys) {
			const data = await redis.get(key);
			if (data) {
				const { startTime } = JSON.parse(data);
				if (startTime < threshold) {
					await redis.del(key);
					cleaned++;
				}
			}
		}

		this.logger.log(`Cleaned up ${cleaned} abandoned voice sessions`);
	}
}
