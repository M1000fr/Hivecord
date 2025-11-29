import { prismaClient } from "@services/prismaService";
import { ChannelType } from '@prisma/client/enums';
import { RedisService } from "@services/RedisService";

const CACHE_TTL = 60; // 60 seconds

export class ConfigService {
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

		const config = await prismaClient.configuration.findUnique({ where: { key } });
		const value = config?.value ?? null;
		
		if (value) await redis.set(cacheKey, value, "EX", CACHE_TTL);
		
		return value;
	}

	static async set(key: string, value: string): Promise<void> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:value:${key}`;
		await redis.del(cacheKey);

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

		await prismaClient.configuration.delete({
			where: { key },
		});
	}

	static async getChannel(key: string): Promise<string | null> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:channel:${key}`;
		const cached = await redis.get(cacheKey);
		if (cached) return cached;

		const config = await prismaClient.channelConfiguration.findUnique({ where: { key } });
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
		await redis.del(cacheKey);

		await prismaClient.channel.upsert({
			where: { id: channelId },
			update: { type: channelType },
			create: { id: channelId, type: channelType },
		});

		await prismaClient.channelConfiguration.upsert({
			where: { key },
			update: { channelId },
			create: { key, channelId },
		});
		await redis.set(cacheKey, channelId, "EX", CACHE_TTL);
	}

	static async getRole(key: string): Promise<string | null> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:role:${key}`;
		const cached = await redis.get(cacheKey);
		if (cached) return cached;

		const config = await prismaClient.roleConfiguration.findFirst({ where: { key } });
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
			await prismaClient.roleConfiguration.delete({ where: { key_roleId: { key, roleId } } });
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
			...Object.fromEntries(configs.map(c => [c.key, c.value])),
			...Object.fromEntries(channelConfigs.map(c => [c.key, c.channelId])),
			...Object.fromEntries(roleConfigs.map(c => [c.key, c.roleId])),
		};
	}
}
