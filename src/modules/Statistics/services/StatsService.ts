import type { LeBotClient } from "@class/LeBotClient";
import { Point } from "@influxdata/influxdb-client";
import { InfluxService } from "@services/InfluxService";
import { RedisService } from "@services/RedisService";
import { Logger } from "@utils/Logger";

const CACHE_TTL = 300; // 5 minutes cache for stats
// Flush behavior tuning
const FLUSH_DEBOUNCE_MS = 1000; // flush up to 1s after last write
const FLUSH_FORCE_INTERVAL_MS = 5000; // force flush if no flush for 5s

export interface TimeRange {
	start: Date;
	end: Date;
}

export interface UserVoiceStats {
	userId: string;
	totalDuration: number; // seconds
	channelBreakdown: { channelId: string; duration: number }[];
	hourlyBreakdown: { hour: number; duration: number }[];
}

export interface UserMessageStats {
	userId: string;
	totalMessages: number;
	channelBreakdown: { channelId: string; count: number }[];
	hourlyBreakdown: { hour: number; count: number }[];
}

export interface ChannelStats {
	channelId: string;
	messageCount: number;
	voiceDuration: number; // seconds
	uniqueUsers: number;
}

export interface ServerStats {
	guildId: string;
	totalMessages: number;
	totalVoiceDuration: number;
	activeUsers: number;
	joinCount: number;
	leaveCount: number;
}

export class StatsService {
	private static logger = new Logger("StatsService");
	private static lastFlush = 0;
	private static flushTimer: ReturnType<typeof setTimeout> | null = null;
	private static pendingUserInvalidations = new Set<string>(); // format: userId|guildId

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
					await this.invalidateUserCache(userId, guildId);
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
		userId: string,
		channelId: string,
		guildId: string,
	): Promise<void> {
		const point = new Point("message_activity")
			.tag("userId", userId)
			.tag("channelId", channelId)
			.tag("guildId", guildId)
			.intField("count", 1)
			.timestamp(new Date());

		InfluxService.writePoint(point);
		// Track user for cache invalidation after flush
		this.pendingUserInvalidations.add(`${userId}|${guildId}`);
		this.scheduleFlush();
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
		await this.invalidateServerCache(guildId);
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
		await this.invalidateServerCache(guildId);
	}

	// Stats Retrieval with Caching
	static async getUserVoiceStats(
		userId: string,
		guildId: string,
		timeRange: TimeRange,
	): Promise<UserVoiceStats> {
		const redis = RedisService.getInstance();
		const cacheKey = `stats:voice:${userId}:${guildId}:${timeRange.start.getTime()}:${timeRange.end.getTime()}`;
		const cached = await redis.get(cacheKey);

		if (cached) {
			return JSON.parse(cached);
		}

		const bucket = InfluxService.getBucket();
		const startTime = timeRange.start.toISOString();
		const endTime = timeRange.end.toISOString();

		// Query total duration
		const durationQuery = `
			from(bucket: "${bucket}")
				|> range(start: ${startTime}, stop: ${endTime})
				|> filter(fn: (r) => r._measurement == "voice_activity")
				|> filter(fn: (r) => r.userId == "${userId}")
				|> filter(fn: (r) => r.guildId == "${guildId}")
				|> filter(fn: (r) => r._field == "duration")
		`;

		const results = await InfluxService.query<{
			_time: string;
			_value: number;
			channelId: string;
		}>(durationQuery);

		// Calculate channel breakdown
		const channelMap = new Map<string, number>();
		const hourMap = new Map<number, number>();
		let totalDuration = 0;

		for (const result of results) {
			const duration = result._value;
			totalDuration += duration;

			// Channel breakdown
			const currentChannelDuration =
				channelMap.get(result.channelId) || 0;
			channelMap.set(result.channelId, currentChannelDuration + duration);

			// Hourly breakdown
			const hour = new Date(result._time).getHours();
			const currentHourDuration = hourMap.get(hour) || 0;
			hourMap.set(hour, currentHourDuration + duration);
		}

		const stats: UserVoiceStats = {
			userId,
			totalDuration,
			channelBreakdown: Array.from(channelMap.entries()).map(
				([channelId, duration]) => ({
					channelId,
					duration,
				}),
			),
			hourlyBreakdown: Array.from(hourMap.entries())
				.map(([hour, duration]) => ({ hour, duration }))
				.sort((a, b) => a.hour - b.hour),
		};

		await redis.set(cacheKey, JSON.stringify(stats), "EX", CACHE_TTL);
		return stats;
	}

	static async getUserMessageStats(
		userId: string,
		guildId: string,
		timeRange: TimeRange,
	): Promise<UserMessageStats> {
		const redis = RedisService.getInstance();
		const cacheKey = `stats:msg:${userId}:${guildId}:${timeRange.start.getTime()}:${timeRange.end.getTime()}`;
		const cached = await redis.get(cacheKey);

		if (cached) {
			return JSON.parse(cached);
		}

		const bucket = InfluxService.getBucket();
		const startTime = timeRange.start.toISOString();
		const endTime = timeRange.end.toISOString();

		const messageQuery = `
			from(bucket: "${bucket}")
				|> range(start: ${startTime}, stop: ${endTime})
				|> filter(fn: (r) => r._measurement == "message_activity")
				|> filter(fn: (r) => r.userId == "${userId}")
				|> filter(fn: (r) => r.guildId == "${guildId}")
				|> filter(fn: (r) => r._field == "count")
		`;

		const results = await InfluxService.query<{
			_time: string;
			_value: number;
			channelId: string;
		}>(messageQuery);

		const channelMap = new Map<string, number>();
		const hourMap = new Map<number, number>();
		let totalMessages = 0;

		for (const result of results) {
			const count = result._value;
			totalMessages += count;

			// Channel breakdown
			const currentChannelCount = channelMap.get(result.channelId) || 0;
			channelMap.set(result.channelId, currentChannelCount + count);

			// Hourly breakdown
			const hour = new Date(result._time).getHours();
			const currentHourCount = hourMap.get(hour) || 0;
			hourMap.set(hour, currentHourCount + count);
		}

		const stats: UserMessageStats = {
			userId,
			totalMessages,
			channelBreakdown: Array.from(channelMap.entries()).map(
				([channelId, count]) => ({
					channelId,
					count,
				}),
			),
			hourlyBreakdown: Array.from(hourMap.entries())
				.map(([hour, count]) => ({ hour, count }))
				.sort((a, b) => a.hour - b.hour),
		};

		await redis.set(cacheKey, JSON.stringify(stats), "EX", CACHE_TTL);
		return stats;
	}

	static async getChannelStats(
		channelId: string,
		guildId: string,
		timeRange: TimeRange,
	): Promise<ChannelStats> {
		const redis = RedisService.getInstance();
		const cacheKey = `stats:channel:${channelId}:${guildId}:${timeRange.start.getTime()}:${timeRange.end.getTime()}`;
		const cached = await redis.get(cacheKey);

		if (cached) {
			return JSON.parse(cached);
		}

		const bucket = InfluxService.getBucket();
		const startTime = timeRange.start.toISOString();
		const endTime = timeRange.end.toISOString();

		// Query message count
		const messageQuery = `
			from(bucket: "${bucket}")
				|> range(start: ${startTime}, stop: ${endTime})
				|> filter(fn: (r) => r._measurement == "message_activity")
				|> filter(fn: (r) => r.channelId == "${channelId}")
				|> filter(fn: (r) => r.guildId == "${guildId}")
				|> filter(fn: (r) => r._field == "count")
				|> sum()
		`;

		// Query voice duration
		const voiceQuery = `
			from(bucket: "${bucket}")
				|> range(start: ${startTime}, stop: ${endTime})
				|> filter(fn: (r) => r._measurement == "voice_activity")
				|> filter(fn: (r) => r.channelId == "${channelId}")
				|> filter(fn: (r) => r.guildId == "${guildId}")
				|> filter(fn: (r) => r._field == "duration")
				|> sum()
		`;

		// Query unique users
		const uniqueUsersQuery = `
			from(bucket: "${bucket}")
				|> range(start: ${startTime}, stop: ${endTime})
				|> filter(fn: (r) => r._measurement == "message_activity" or r._measurement == "voice_activity")
				|> filter(fn: (r) => r.channelId == "${channelId}")
				|> filter(fn: (r) => r.guildId == "${guildId}")
				|> keep(columns: ["userId"])
				|> distinct(column: "userId")
				|> count()
		`;

		const [messageResults, voiceResults, uniqueResults] = await Promise.all(
			[
				InfluxService.query<{ _value: number }>(messageQuery),
				InfluxService.query<{ _value: number }>(voiceQuery),
				InfluxService.query<{ _value: number }>(uniqueUsersQuery),
			],
		);

		const stats: ChannelStats = {
			channelId,
			messageCount: messageResults[0]?._value || 0,
			voiceDuration: voiceResults[0]?._value || 0,
			uniqueUsers: uniqueResults[0]?._value || 0,
		};

		await redis.set(cacheKey, JSON.stringify(stats), "EX", CACHE_TTL);
		return stats;
	}

	static async getServerStats(
		guildId: string,
		timeRange: TimeRange,
	): Promise<ServerStats> {
		const redis = RedisService.getInstance();
		const cacheKey = `stats:server:${guildId}:${timeRange.start.getTime()}:${timeRange.end.getTime()}`;
		const cached = await redis.get(cacheKey);

		if (cached) {
			return JSON.parse(cached);
		}

		const bucket = InfluxService.getBucket();
		const startTime = timeRange.start.toISOString();
		const endTime = timeRange.end.toISOString();

		// Total messages
		const messageQuery = `
			from(bucket: "${bucket}")
				|> range(start: ${startTime}, stop: ${endTime})
				|> filter(fn: (r) => r._measurement == "message_activity")
				|> filter(fn: (r) => r.guildId == "${guildId}")
				|> filter(fn: (r) => r._field == "count")
				|> sum()
		`;

		// Total voice duration
		const voiceQuery = `
			from(bucket: "${bucket}")
				|> range(start: ${startTime}, stop: ${endTime})
				|> filter(fn: (r) => r._measurement == "voice_activity")
				|> filter(fn: (r) => r.guildId == "${guildId}")
				|> filter(fn: (r) => r._field == "duration")
				|> sum()
		`;

		// Active users (unique)
		const activeUsersQuery = `
			from(bucket: "${bucket}")
				|> range(start: ${startTime}, stop: ${endTime})
				|> filter(fn: (r) => r._measurement == "message_activity" or r._measurement == "voice_activity")
				|> filter(fn: (r) => r.guildId == "${guildId}")
				|> keep(columns: ["userId"])
				|> distinct(column: "userId")
				|> count()
		`;

		// Join count
		const joinQuery = `
			from(bucket: "${bucket}")
				|> range(start: ${startTime}, stop: ${endTime})
				|> filter(fn: (r) => r._measurement == "server_activity")
				|> filter(fn: (r) => r.guildId == "${guildId}")
				|> filter(fn: (r) => r.action == "JOIN")
				|> count()
		`;

		// Leave count
		const leaveQuery = `
			from(bucket: "${bucket}")
				|> range(start: ${startTime}, stop: ${endTime})
				|> filter(fn: (r) => r._measurement == "server_activity")
				|> filter(fn: (r) => r.guildId == "${guildId}")
				|> filter(fn: (r) => r.action == "LEAVE")
				|> count()
		`;

		const [
			messageResults,
			voiceResults,
			activeResults,
			joinResults,
			leaveResults,
		] = await Promise.all([
			InfluxService.query<{ _value: number }>(messageQuery),
			InfluxService.query<{ _value: number }>(voiceQuery),
			InfluxService.query<{ _value: number }>(activeUsersQuery),
			InfluxService.query<{ _value: number }>(joinQuery),
			InfluxService.query<{ _value: number }>(leaveQuery),
		]);

		const stats: ServerStats = {
			guildId,
			totalMessages: messageResults[0]?._value || 0,
			totalVoiceDuration: voiceResults[0]?._value || 0,
			activeUsers: activeResults[0]?._value || 0,
			joinCount: joinResults[0]?._value || 0,
			leaveCount: leaveResults[0]?._value || 0,
		};

		await redis.set(cacheKey, JSON.stringify(stats), "EX", CACHE_TTL);
		return stats;
	}

	// Most Active Channels
	static async getMostActiveChannels(
		guildId: string,
		timeRange: TimeRange,
		limit = 10,
	): Promise<
		{ channelId: string; messageCount: number; voiceDuration: number }[]
	> {
		const bucket = InfluxService.getBucket();
		const startTime = timeRange.start.toISOString();
		const endTime = timeRange.end.toISOString();

		const query = `
			from(bucket: "${bucket}")
				|> range(start: ${startTime}, stop: ${endTime})
				|> filter(fn: (r) => r._measurement == "message_activity" or r._measurement == "voice_activity")
				|> filter(fn: (r) => r.guildId == "${guildId}")
				|> group(columns: ["channelId", "_measurement"])
				|> sum()
				|> group(columns: ["channelId"])
				|> sort(desc: true)
				|> limit(n: ${limit})
		`;

		const results = await InfluxService.query<{
			_value: number;
			_measurement: string;
			channelId: string;
		}>(query);

		const channelMap = new Map<
			string,
			{ messageCount: number; voiceDuration: number }
		>();

		for (const result of results) {
			const current = channelMap.get(result.channelId) || {
				messageCount: 0,
				voiceDuration: 0,
			};

			if (result._measurement === "message_activity") {
				current.messageCount += result._value;
			} else if (result._measurement === "voice_activity") {
				current.voiceDuration += result._value;
			}

			channelMap.set(result.channelId, current);
		}

		return Array.from(channelMap.entries())
			.map(([channelId, stats]) => ({ channelId, ...stats }))
			.sort(
				(a, b) =>
					b.messageCount +
					b.voiceDuration -
					(a.messageCount + a.voiceDuration),
			)
			.slice(0, limit);
	}

	// Most Active Users (Voice)
	static async getMostActiveVoiceUsers(
		guildId: string,
		timeRange: TimeRange,
		limit = 10,
	): Promise<{ userId: string; totalDuration: number }[]> {
		const bucket = InfluxService.getBucket();
		const startTime = timeRange.start.toISOString();
		const endTime = timeRange.end.toISOString();

		const query = `
			from(bucket: "${bucket}")
				|> range(start: ${startTime}, stop: ${endTime})
				|> filter(fn: (r) => r._measurement == "voice_activity")
				|> filter(fn: (r) => r.guildId == "${guildId}")
				|> filter(fn: (r) => r._field == "duration")
				|> group(columns: ["userId"])
				|> sum()
				|> group()
				|> sort(desc: true)
				|> limit(n: ${limit})
		`;

		const results = await InfluxService.query<{
			_value: number;
			userId: string;
		}>(query);

		return results.map((r) => ({
			userId: r.userId,
			totalDuration: r._value,
		}));
	}

	// Most Active Users (Messages)
	static async getMostActiveMessageUsers(
		guildId: string,
		timeRange: TimeRange,
		limit = 10,
	): Promise<{ userId: string; totalMessages: number }[]> {
		const bucket = InfluxService.getBucket();
		const startTime = timeRange.start.toISOString();
		const endTime = timeRange.end.toISOString();

		const query = `
			from(bucket: "${bucket}")
				|> range(start: ${startTime}, stop: ${endTime})
				|> filter(fn: (r) => r._measurement == "message_activity")
				|> filter(fn: (r) => r.guildId == "${guildId}")
				|> filter(fn: (r) => r._field == "count")
				|> group(columns: ["userId"])
				|> sum()
				|> group()
				|> sort(desc: true)
				|> limit(n: ${limit})
		`;

		const results = await InfluxService.query<{
			_value: number;
			userId: string;
		}>(query);

		return results.map((r) => ({
			userId: r.userId,
			totalMessages: r._value,
		}));
	}

	// Cache Invalidation
	private static async invalidateUserCache(
		userId: string,
		guildId: string,
	): Promise<void> {
		const redis = RedisService.getInstance();
		const patterns = [
			`stats:voice:${userId}:${guildId}:*`,
			`stats:msg:${userId}:${guildId}:*`,
		];

		for (const pattern of patterns) {
			const keys = await redis.keys(pattern);
			if (keys.length > 0) {
				await redis.del(...keys);
			}
		}
	}

	private static async invalidateServerCache(guildId: string): Promise<void> {
		const redis = RedisService.getInstance();
		const pattern = `stats:server:${guildId}:*`;
		const keys = await redis.keys(pattern);
		if (keys.length > 0) {
			await redis.del(...keys);
		}
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
