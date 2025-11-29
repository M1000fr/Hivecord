import Redis from "ioredis";
import { Logger } from '@utils/Logger';

export class RedisService {
	private static instance: Redis;
	static logger = new Logger("RedisService");

	public static getInstance(): Redis {
		if (!this.instance) {
			const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
			this.instance = new Redis(redisUrl);

			this.instance.on("error", (err) => {
				this.logger.error("Redis Error:", err.stack, "RedisService");
			});

			this.instance.on("connect", () => {
				this.logger.log("Connected to Redis");
			});
		}
		return this.instance;
	}

	public static async checkConnection(): Promise<void> {
		const redis = this.getInstance();
		try {
			await redis.ping();
			this.logger.log("✅ Connected to Redis");
		} catch (error) {
			this.logger.error("❌ Redis connection failed:", error, "RedisService");
			process.exit(1);
		}
	}
}
