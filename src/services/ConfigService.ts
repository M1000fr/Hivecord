import { ChannelType } from "@prisma/client/enums";
import { EntityService } from "@services/EntityService";
import { prismaClient } from "@services/prismaService";
import { RedisService } from "@services/RedisService";
import { Logger } from "@utils/Logger";

const CACHE_TTL = 60; // 60 seconds

export class ConfigService {
	private static logger = new Logger("ConfigService");

	private static async ensureRoleExists(
		roleId: string,
		guildId: string,
	): Promise<void> {
		await EntityService.ensureRoleById(guildId, roleId);
	}

	static async get(guildId: string, key: string): Promise<string | null> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:value:${key}`;
		const cached = await redis.get(cacheKey);
		if (cached) return cached;

		const config = await prismaClient.configuration.findUnique({
			where: { guildId_key: { guildId, key } },
		});
		const value = config?.value ?? null;

		if (value) await redis.set(cacheKey, value, "EX", CACHE_TTL);

		return value;
	}

	static async set(
		guildId: string,
		key: string,
		value: string,
	): Promise<void> {
		await EntityService.ensureGuildById(guildId);
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:value:${key}`;
		await redis.del(cacheKey);

		this.logger.log(`Config updated [${guildId}]: ${key} = ${value}`);

		await prismaClient.configuration.upsert({
			where: { guildId_key: { guildId, key } },
			update: { value },
			create: { guildId, key, value },
		});
		await redis.set(cacheKey, value, "EX", CACHE_TTL);
	}

	static async delete(guildId: string, key: string): Promise<void> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:value:${key}`;
		await redis.del(cacheKey);

		this.logger.log(`Config deleted [${guildId}]: ${key}`);

		try {
			await prismaClient.configuration.delete({
				where: { guildId_key: { guildId, key } },
			});
		} catch {
			// Ignore if not found
		}
	}

	static async getChannel(
		guildId: string,
		key: string,
	): Promise<string | null> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:channel:${key}`;
		const cached = await redis.get(cacheKey);
		if (cached) return cached;

		const config = await prismaClient.channelConfiguration.findFirst({
			where: {
				key,
				Channel: { guildId },
			},
		});
		const value = config?.channelId ?? null;

		if (value) await redis.set(cacheKey, value, "EX", CACHE_TTL);

		return value;
	}

	static async setChannel(
		guildId: string,
		key: string,
		channelId: string,
		channelType: ChannelType = ChannelType.TEXT,
	): Promise<void> {
		await EntityService.ensureGuildById(guildId);
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:channel:${key}`;
		const channelsCacheKey = `config:${guildId}:channels:${key}`;
		await redis.del(cacheKey);
		await redis.del(channelsCacheKey);

		await EntityService.ensureChannelById(guildId, channelId, channelType);

		await prismaClient.$transaction([
			prismaClient.channelConfiguration.deleteMany({
				where: {
					key,
					Channel: { guildId },
				},
			}),
			prismaClient.channelConfiguration.create({
				data: { key, channelId },
			}),
		]);
		await redis.set(cacheKey, channelId, "EX", CACHE_TTL);
	}

	static async getChannels(guildId: string, key: string): Promise<string[]> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:channels:${key}`;
		const cached = await redis.get(cacheKey);
		if (cached) return JSON.parse(cached);

		const configs = await prismaClient.channelConfiguration.findMany({
			where: {
				key,
				Channel: { guildId },
			},
		});
		const values = configs.map((c) => c.channelId);

		await redis.set(cacheKey, JSON.stringify(values), "EX", CACHE_TTL);

		return values;
	}

	static async addChannel(
		guildId: string,
		key: string,
		channelId: string,
		channelType: ChannelType = ChannelType.TEXT,
	): Promise<void> {
		await EntityService.ensureGuildById(guildId);
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:channels:${key}`;
		const channelCacheKey = `config:${guildId}:channel:${key}`;
		await redis.del(cacheKey);
		await redis.del(channelCacheKey);

		await EntityService.ensureChannelById(guildId, channelId, channelType);

		await prismaClient.channelConfiguration.upsert({
			where: { key_channelId: { key, channelId } },
			update: {},
			create: { key, channelId },
		});
	}

	static async removeChannel(
		guildId: string,
		key: string,
		channelId: string,
	): Promise<void> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:channels:${key}`;
		const channelCacheKey = `config:${guildId}:channel:${key}`;
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

	static async getRole(guildId: string, key: string): Promise<string | null> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:role:${key}`;
		const cached = await redis.get(cacheKey);
		if (cached) return cached;

		const config = await prismaClient.roleConfiguration.findFirst({
			where: {
				key,
				Role: { guildId },
			},
		});
		const value = config?.roleId ?? null;

		if (value) await redis.set(cacheKey, value, "EX", CACHE_TTL);

		return value;
	}

	static async setRole(
		guildId: string,
		key: string,
		roleId: string,
	): Promise<void> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:role:${key}`;
		const rolesCacheKey = `config:${guildId}:roles:${key}`;
		await redis.del(cacheKey);
		await redis.del(rolesCacheKey);

		await this.ensureRoleExists(roleId, guildId);
		await prismaClient.$transaction([
			prismaClient.roleConfiguration.deleteMany({
				where: {
					key,
					Role: { guildId },
				},
			}),
			prismaClient.roleConfiguration.create({ data: { key, roleId } }),
		]);
		await redis.set(cacheKey, roleId, "EX", CACHE_TTL);
	}

	static async getRoles(guildId: string, key: string): Promise<string[]> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:roles:${key}`;
		const cached = await redis.get(cacheKey);
		if (cached) return JSON.parse(cached);

		const configs = await prismaClient.roleConfiguration.findMany({
			where: {
				key,
				Role: { guildId },
			},
		});
		const values = configs.map((c) => c.roleId);

		await redis.set(cacheKey, JSON.stringify(values), "EX", CACHE_TTL);

		return values;
	}

	static async setRoles(
		guildId: string,
		key: string,
		roleIds: string[],
	): Promise<void> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:roles:${key}`;
		const roleCacheKey = `config:${guildId}:role:${key}`;
		await redis.del(cacheKey);
		await redis.del(roleCacheKey);

		await prismaClient.$transaction(async (tx) => {
			await tx.roleConfiguration.deleteMany({
				where: {
					key,
					Role: { guildId },
				},
			});
			for (const roleId of roleIds) {
				await tx.role.upsert({
					where: { id: roleId },
					update: { guildId },
					create: { id: roleId, guildId },
				});
				await tx.roleConfiguration.create({ data: { key, roleId } });
			}
		});
		await redis.set(cacheKey, JSON.stringify(roleIds), "EX", CACHE_TTL);
	}

	static async addRole(
		guildId: string,
		key: string,
		roleId: string,
	): Promise<void> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:roles:${key}`;
		const roleCacheKey = `config:${guildId}:role:${key}`;
		await redis.del(cacheKey);
		await redis.del(roleCacheKey);

		await this.ensureRoleExists(roleId, guildId);
		await prismaClient.roleConfiguration.upsert({
			where: { key_roleId: { key, roleId } },
			update: {},
			create: { key, roleId },
		});
	}

	static async removeRole(
		guildId: string,
		key: string,
		roleId: string,
	): Promise<void> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:roles:${key}`;
		const roleCacheKey = `config:${guildId}:role:${key}`;
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

	static async deleteRole(guildId: string, key: string): Promise<void> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:role:${key}`;
		const rolesCacheKey = `config:${guildId}:roles:${key}`;
		await redis.del(cacheKey);
		await redis.del(rolesCacheKey);

		await prismaClient.roleConfiguration.deleteMany({
			where: {
				key,
				Role: { guildId },
			},
		});
	}

	static async deleteChannel(guildId: string, key: string): Promise<void> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:channel:${key}`;
		const channelsCacheKey = `config:${guildId}:channels:${key}`;
		await redis.del(cacheKey);
		await redis.del(channelsCacheKey);

		await prismaClient.channelConfiguration.deleteMany({
			where: {
				key,
				Channel: { guildId },
			},
		});
	}

	static async getAll(guildId: string): Promise<Record<string, string>> {
		const [configs, channelConfigs, roleConfigs] = await Promise.all([
			prismaClient.configuration.findMany({ where: { guildId } }),
			prismaClient.channelConfiguration.findMany({
				where: { Channel: { guildId } },
			}),
			prismaClient.roleConfiguration.findMany({
				where: { Role: { guildId } },
			}),
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
