import Redis from "ioredis";

export class RedisService {
	private static instance: Redis;

	public static getInstance(): Redis {
		if (!this.instance) {
			const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
			this.instance = new Redis(redisUrl);

			this.instance.on("error", (err) => {
				console.error("Redis Error:", err);
			});

			this.instance.on("connect", () => {
				console.log("Connected to Redis");
			});
		}
		return this.instance;
	}
}
