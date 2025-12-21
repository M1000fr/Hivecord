import { Injectable } from "@decorators/Injectable";
import { Logger } from "@utils/Logger";
import Redis from "ioredis";

@Injectable({ scope: "global" })
export class RedisService {
	public readonly client: Redis;
	private readonly logger = new Logger("RedisService");

	constructor() {
		const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
		this.client = new Redis(redisUrl);

		this.client.on("error", (err) => {
			this.logger.error("Redis Error:", err.stack, "RedisService");
		});

		this.client.on("connect", () => {
			this.logger.log("Connected to Redis");
		});
	}

	public async checkConnection(): Promise<void> {
		try {
			await this.client.ping();
		} catch (error) {
			const trace = error instanceof Error ? error.stack : String(error);
			this.logger.error(
				"Redis connection failed:",
				trace,
				"RedisService",
			);
			process.exit(1);
		}
	}
}
