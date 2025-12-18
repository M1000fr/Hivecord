import { RedisService } from "@services/RedisService";
import { prismaClient } from "@services/prismaService";
import { Logger } from "@utils/Logger";

export class StatsService {
	private static instance: StatsService;
	private redis = RedisService.getInstance();
	private logger = new Logger("StatsService");

	public static getInstance(): StatsService {
		if (!StatsService.instance) {
			StatsService.instance = new StatsService();
		}
		return StatsService.instance;
	}

	async incrementMessageCount(userId: string, guildId: string) {
		// 1. Increment persistent stats
		await prismaClient.userStats.upsert({
			where: { userId_guildId: { userId, guildId } },
			update: { messageCount: { increment: 1 } },
			create: { userId, guildId, messageCount: 1 },
		});

		// 2. Add to Redis for sliding window (1h)
		const key = `stats:msg_1h:${guildId}:${userId}`;
		const now = Date.now();
		const oneHourAgo = now - 3600 * 1000;

		// Use timestamp as score and member to ensure uniqueness
		await this.redis.zadd(key, now, `${now}`);
		await this.redis.zremrangebyscore(key, 0, oneHourAgo);
		await this.redis.expire(key, 3600); // Expire if inactive
	}

	async getMessageCountInLastHour(
		userId: string,
		guildId: string,
	): Promise<number> {
		const key = `stats:msg_1h:${guildId}:${userId}`;
		// Clean up first to be accurate
		const now = Date.now();
		const oneHourAgo = now - 3600 * 1000;
		await this.redis.zremrangebyscore(key, 0, oneHourAgo);

		return await this.redis.zcard(key);
	}

	async incrementVoiceDuration(
		userId: string,
		guildId: string,
		durationSeconds: number,
	) {
		await prismaClient.userStats.upsert({
			where: { userId_guildId: { userId, guildId } },
			update: { voiceDuration: { increment: durationSeconds } },
			create: { userId, guildId, voiceDuration: durationSeconds },
		});
	}

	async incrementInviteCount(userId: string, guildId: string) {
		await prismaClient.userStats.upsert({
			where: { userId_guildId: { userId, guildId } },
			update: { inviteCount: { increment: 1 } },
			create: { userId, guildId, inviteCount: 1 },
		});
	}

	async getStats(userId: string, guildId: string) {
		return await prismaClient.userStats.findUnique({
			where: { userId_guildId: { userId, guildId } },
		});
	}
}
