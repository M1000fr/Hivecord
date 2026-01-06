import { Injectable } from "@decorators/Injectable";
import { env } from "@utils/Env";
import { Logger } from "@utils/Logger";
import Redis from "ioredis";

@Injectable({ scope: "global" })
export class RedisService {
	public readonly client: Redis;
	private readonly logger = new Logger("RedisService");

	constructor() {
		this.client = new Redis(env.REDIS_URL);

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
