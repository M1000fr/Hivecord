import { ChannelType } from "@prisma/client/enums";
import { prismaClient } from "@services/prismaService";
import { RedisService } from "@services/RedisService";
import { Logger } from "@utils/Logger";

const CACHE_TTL = 60; // 60 seconds

export class ConfigService {
	private static logger = new Logger("ConfigService");

	private static async ensureRoleExists(roleId: string): Promise<void> {
		await prismaClient.role.upsert({
			where: { id: roleId },
			update: {},
			create: { id: roleId },
		});
	}

	static async get(key: string): Promise<string | null> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:value:${key}`;
		const cached = await redis.get(cacheKey);
		if (cached) return cached;

		const config = await prismaClient.configuration.findUnique({
			where: { key },
		});
		const value = config?.value ?? null;

		if (value) await redis.set(cacheKey, value, "EX", CACHE_TTL);

		return value;
	}

	static async set(key: string, value: string): Promise<void> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:value:${key}`;
		await redis.del(cacheKey);

		this.logger.log(`Config updated: ${key} = ${value}`);

		await prismaClient.configuration.upsert({
			where: { key },
			update: { value },
			create: { key, value },
		});
		await redis.set(cacheKey, value, "EX", CACHE_TTL);
	}

	static async delete(key: string): Promise<void> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:value:${key}`;
		await redis.del(cacheKey);

		this.logger.log(`Config deleted: ${key}`);

		await prismaClient.configuration.delete({
			where: { key },
		});
	}

	static async getChannel(key: string): Promise<string | null> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:channel:${key}`;
		const cached = await redis.get(cacheKey);
		if (cached) return cached;

		const config = await prismaClient.channelConfiguration.findFirst({
			where: { key },
		});
		const value = config?.channelId ?? null;

		if (value) await redis.set(cacheKey, value, "EX", CACHE_TTL);

		return value;
	}

	static async setChannel(
		key: string,
		channelId: string,
		channelType: ChannelType = ChannelType.TEXT,
	): Promise<void> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:channel:${key}`;
		const channelsCacheKey = `config:channels:${key}`;
		await redis.del(cacheKey);
		await redis.del(channelsCacheKey);

		await prismaClient.channel.upsert({
			where: { id: channelId },
			update: { type: channelType },
			create: { id: channelId, type: channelType },
		});

		await prismaClient.$transaction([
			prismaClient.channelConfiguration.deleteMany({ where: { key } }),
			prismaClient.channelConfiguration.create({
				data: { key, channelId },
			}),
		]);
		await redis.set(cacheKey, channelId, "EX", CACHE_TTL);
	}

	static async getChannels(key: string): Promise<string[]> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:channels:${key}`;
		const cached = await redis.get(cacheKey);
		if (cached) return JSON.parse(cached);

		const configs = await prismaClient.channelConfiguration.findMany({
			where: { key },
		});
		const values = configs.map((c) => c.channelId);

		await redis.set(cacheKey, JSON.stringify(values), "EX", CACHE_TTL);

		return values;
	}

	static async addChannel(
		key: string,
		channelId: string,
		channelType: ChannelType = ChannelType.TEXT,
	): Promise<void> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:channels:${key}`;
		const channelCacheKey = `config:channel:${key}`;
		await redis.del(cacheKey);
		await redis.del(channelCacheKey);

		await prismaClient.channel.upsert({
			where: { id: channelId },
			update: { type: channelType },
			create: { id: channelId, type: channelType },
		});

		await prismaClient.channelConfiguration.upsert({
			where: { key_channelId: { key, channelId } },
			update: {},
			create: { key, channelId },
		});
	}

	static async removeChannel(key: string, channelId: string): Promise<void> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:channels:${key}`;
		const channelCacheKey = `config:channel:${key}`;
		await redis.del(cacheKey);
		await redis.del(channelCacheKey);

		try {
			await prismaClient.channelConfiguration.delete({
				where: { key_channelId: { key, channelId } },
			});
		} catch {
			// Ignore if not found
		}
	}

	static async getRole(key: string): Promise<string | null> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:role:${key}`;
		const cached = await redis.get(cacheKey);
		if (cached) return cached;

		const config = await prismaClient.roleConfiguration.findFirst({
			where: { key },
		});
		const value = config?.roleId ?? null;

		if (value) await redis.set(cacheKey, value, "EX", CACHE_TTL);

		return value;
	}

	static async setRole(key: string, roleId: string): Promise<void> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:role:${key}`;
		const rolesCacheKey = `config:roles:${key}`;
		await redis.del(cacheKey);
		await redis.del(rolesCacheKey);

		await this.ensureRoleExists(roleId);
		await prismaClient.$transaction([
			prismaClient.roleConfiguration.deleteMany({ where: { key } }),
			prismaClient.roleConfiguration.create({ data: { key, roleId } }),
		]);
		await redis.set(cacheKey, roleId, "EX", CACHE_TTL);
	}

	static async getRoles(key: string): Promise<string[]> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:roles:${key}`;
		const cached = await redis.get(cacheKey);
		if (cached) return JSON.parse(cached);

		const configs = await prismaClient.roleConfiguration.findMany({
			where: { key },
		});
		const values = configs.map((c) => c.roleId);

		await redis.set(cacheKey, JSON.stringify(values), "EX", CACHE_TTL);

		return values;
	}

	static async setRoles(key: string, roleIds: string[]): Promise<void> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:roles:${key}`;
		const roleCacheKey = `config:role:${key}`;
		await redis.del(cacheKey);
		await redis.del(roleCacheKey);

		await prismaClient.$transaction(async (tx) => {
			await tx.roleConfiguration.deleteMany({ where: { key } });
			for (const roleId of roleIds) {
				await this.ensureRoleExists(roleId);
				await tx.roleConfiguration.create({ data: { key, roleId } });
			}
		});
		await redis.set(cacheKey, JSON.stringify(roleIds), "EX", CACHE_TTL);
	}

	static async addRole(key: string, roleId: string): Promise<void> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:roles:${key}`;
		const roleCacheKey = `config:role:${key}`;
		await redis.del(cacheKey);
		await redis.del(roleCacheKey);

		await this.ensureRoleExists(roleId);
		await prismaClient.roleConfiguration.upsert({
			where: { key_roleId: { key, roleId } },
			update: {},
			create: { key, roleId },
		});
	}

	static async removeRole(key: string, roleId: string): Promise<void> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:roles:${key}`;
		const roleCacheKey = `config:role:${key}`;
		await redis.del(cacheKey);
		await redis.del(roleCacheKey);

		try {
			await prismaClient.roleConfiguration.delete({
				where: { key_roleId: { key, roleId } },
			});
		} catch {
			// Ignore if not found
		}
	}

	static async getAll(): Promise<Record<string, string>> {
		const [configs, channelConfigs, roleConfigs] = await Promise.all([
			prismaClient.configuration.findMany(),
			prismaClient.channelConfiguration.findMany(),
			prismaClient.roleConfiguration.findMany(),
		]);

		return {
			...Object.fromEntries(configs.map((c) => [c.key, c.value])),
			...Object.fromEntries(
				channelConfigs.map((c) => [c.key, c.channelId]),
			),
			...Object.fromEntries(roleConfigs.map((c) => [c.key, c.roleId])),
		};
	}
}
