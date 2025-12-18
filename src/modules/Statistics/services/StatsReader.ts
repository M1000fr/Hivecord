import { InfluxService } from "@services/InfluxService";
import { prismaClient } from "@services/prismaService";
import { RedisService } from "@services/RedisService";
import type {
	ChannelStats,
	ServerStats,
	TimeRange,
	UserMessageStats,
	UserVoiceStats,
} from "../types";

const CACHE_TTL = 300; // 5 minutes cache for stats

export class StatsReader {
	/**
	 * Get persistent user stats (Cold Storage)
	 */
	static async getUserStats(userId: string, guildId: string) {
		return await prismaClient.userStats.findUnique({
			where: { userId_guildId: { userId, guildId } },
		});
	}

	static async getMessageCountInLastHour(
		userId: string,
		guildId: string,
	): Promise<number> {
		const redis = RedisService.getInstance();
		const key = `stats:msg_1h:${guildId}:${userId}`;
		// Clean up first to be accurate
		const now = Date.now();
		const oneHourAgo = now - 3600 * 1000;
		await redis.zremrangebyscore(key, 0, oneHourAgo);

		return await redis.zcard(key);
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
		const timeMap = new Map<number, number>();
		let totalDuration = 0;

		for (const result of results) {
			const duration = result._value;
			totalDuration += duration;

			// Channel breakdown
			const currentChannelDuration =
				channelMap.get(result.channelId) || 0;
			channelMap.set(result.channelId, currentChannelDuration + duration);

			// Time breakdown (bucket by hour)
			const date = new Date(result._time);
			date.setMinutes(0, 0, 0);
			const timestamp = date.getTime();
			const currentTimestampDuration = timeMap.get(timestamp) || 0;
			timeMap.set(timestamp, currentTimestampDuration + duration);
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
			timeSeries: Array.from(timeMap.entries())
				.map(([timestamp, value]) => ({ timestamp, value }))
				.sort((a, b) => a.timestamp - b.timestamp),
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
		const timeMap = new Map<number, number>();
		let totalMessages = 0;

		for (const result of results) {
			const count = result._value;
			totalMessages += count;

			// Channel breakdown
			const currentChannelCount = channelMap.get(result.channelId) || 0;
			channelMap.set(result.channelId, currentChannelCount + count);

			// Time breakdown (bucket by hour)
			const date = new Date(result._time);
			date.setMinutes(0, 0, 0);
			const timestamp = date.getTime();
			const currentTimestampCount = timeMap.get(timestamp) || 0;
			timeMap.set(timestamp, currentTimestampCount + count);
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
			timeSeries: Array.from(timeMap.entries())
				.map(([timestamp, value]) => ({ timestamp, value }))
				.sort((a, b) => a.timestamp - b.timestamp),
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
	static async invalidateUserCache(
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

	static async invalidateServerCache(guildId: string): Promise<void> {
		const redis = RedisService.getInstance();
		const pattern = `stats:server:${guildId}:*`;
		const keys = await redis.keys(pattern);
		if (keys.length > 0) {
			await redis.del(...keys);
		}
	}
}
