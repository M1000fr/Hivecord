import { Injectable } from "@decorators/Injectable";
import { RedisService } from "@modules/Core/services/RedisService";

const CACHE_TTL = 60; // 60 seconds

export type CacheType =
	| "value"
	| "list"
	| "channel"
	| "channels"
	| "role"
	| "roles";

@Injectable()
export class ConfigCacheService {
	constructor(private readonly redis: RedisService) {}

	private getCacheKey(guildId: string, type: CacheType, key: string): string {
		return `config:${guildId}:${type}:${key}`;
	}

	async get<T>(
		guildId: string,
		type: CacheType,
		key: string,
		fetcher: () => Promise<T>,
		isList = false,
	): Promise<T> {
		const redis = this.redis.client;
		const cacheKey = this.getCacheKey(guildId, type, key);

		if (isList) {
			const cached = await redis.lrange(cacheKey, 0, -1);
			if (cached && cached.length > 0) return cached as unknown as T;
		} else {
			const cached = await redis.get(cacheKey);
			if (cached !== null) {
				try {
					return (
						type === "channels" || type === "roles"
							? JSON.parse(cached)
							: cached
					) as T;
				} catch {
					return cached as unknown as T;
				}
			}
		}

		const value = await fetcher();

		if (value !== null && value !== undefined) {
			if (isList && Array.isArray(value)) {
				if (value.length > 0) {
					await redis.rpush(cacheKey, ...value.map(String));
					await redis.expire(cacheKey, CACHE_TTL);
				}
			} else {
				const stringValue =
					typeof value === "string" ? value : JSON.stringify(value);
				await redis.set(cacheKey, stringValue, "EX", CACHE_TTL);
			}
		}

		return value;
	}

	async invalidate(guildId: string, key: string): Promise<void> {
		const redis = this.redis.client;
		const types: CacheType[] = [
			"value",
			"list",
			"channel",
			"channels",
			"role",
			"roles",
		];
		const keys = types.map((type) => this.getCacheKey(guildId, type, key));
		await redis.del(...keys);
	}
}
