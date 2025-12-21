import {
	EConfigType,
	toConfigKey,
	type ConfigKey,
	type IConfigClass,
} from "@decorators/ConfigProperty";
import { Injectable } from "@decorators/Injectable";
import { ChannelType } from "@prisma/client/enums";
import { ConfigRegistry } from "@registers/ConfigRegistry";
import { ConfigUpdateRegistry } from "@registers/ConfigUpdateRegistry";
import { EntityService } from "@services/EntityService";
import { PrismaService } from "@services/PrismaService";
import { RedisService } from "@services/RedisService";
import { Logger } from "@utils/Logger";

const CACHE_TTL = 60; // 60 seconds

export type ConfigProxy<T> = {
	[K in keyof T]: Promise<T[K]>;
};

@Injectable()
export class ConfigService {
	private logger = new Logger("ConfigService");

	constructor(
		private readonly entityService: EntityService,
		private readonly prisma: PrismaService,
	) {}

	of<T extends object>(
		guildId: string,
		configClass: new () => T,
	): ConfigProxy<T> {
		const metadata = (configClass as unknown as IConfigClass)
			.configProperties;

		return new Proxy({} as ConfigProxy<T>, {
			get: (_target, prop) => {
				if (typeof prop !== "string") return undefined;
				const key = toConfigKey(prop);
				const options = metadata?.[prop];

				if (!options) {
					return this.get(guildId, key);
				}

				switch (options.type) {
					case EConfigType.Channel:
						return this.getChannel(guildId, key);
					case EConfigType.Role:
						return this.getRole(guildId, key);
					case EConfigType.RoleArray:
						return this.getRoles(guildId, key);
					case EConfigType.StringArray:
						return this.getMany(guildId, key);
					case EConfigType.Integer:
					case EConfigType.Number:
						return this.get(guildId, key).then((v) =>
							v !== null ? Number(v) : null,
						);
					case EConfigType.Boolean:
						return this.get(guildId, key).then((v) =>
							v !== null ? v === "true" : null,
						);
					default:
						return this.get(guildId, key);
				}
			},
		});
	}

	private async ensureRoleExists(
		roleId: string,
		guildId: string,
	): Promise<void> {
		await this.entityService.ensureRoleById(guildId, roleId);
	}

	async get<T extends string | null = string | null>(
		guildId: string,
		key: ConfigKey<T> | string,
	): Promise<T> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:value:${key}`;
		const cached = await redis.get(cacheKey);
		if (cached !== null) return cached as T;

		const config = await this.prisma.configuration.findFirst({
			where: { guildId, key },
		});
		let value = config?.value ?? null;

		if (value === null) {
			const defaultValue = ConfigRegistry.getDefault(key);
			if (defaultValue !== undefined) {
				value = String(defaultValue);
			}
		}

		if (value !== null) await redis.set(cacheKey, value, "EX", CACHE_TTL);

		return value as T;
	}

	async set(guildId: string, key: string, value: string): Promise<void> {
		await this.entityService.ensureGuildById(guildId);
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:value:${key}`;

		this.logger.log(`Config updated [${guildId}]: ${key} = ${value}`);

		// Ensure only one value exists for this key
		await this.prisma.configuration.deleteMany({
			where: { guildId, key },
		});
		await this.prisma.configuration.create({
			data: { guildId, key, value },
		});

		await redis.del(cacheKey);
		await ConfigUpdateRegistry.execute(guildId, key, value);
	}

	async getMany(guildId: string, key: string): Promise<string[]> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:list:${key}`;
		const cached = await redis.lrange(cacheKey, 0, -1);
		if (cached && cached.length > 0) return cached;

		const configs = await this.prisma.configuration.findMany({
			where: { guildId, key },
			orderBy: { id: "asc" },
		});
		const values = configs.map((c) => c.value);

		if (values.length > 0) {
			await redis.rpush(cacheKey, ...values);
			await redis.expire(cacheKey, CACHE_TTL);
		}

		return values;
	}

	async setMany(
		guildId: string,
		key: string,
		values: string[],
	): Promise<void> {
		await this.entityService.ensureGuildById(guildId);
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:list:${key}`;
		await redis.del(cacheKey);

		this.logger.log(
			`Config list updated [${guildId}]: ${key} = [${values.join(", ")}]`,
		);

		await this.prisma.configuration.deleteMany({
			where: { guildId, key },
		});

		if (values.length > 0) {
			await this.prisma.configuration.createMany({
				data: values.map((value) => ({ guildId, key, value })),
			});
			await redis.rpush(cacheKey, ...values);
			await redis.expire(cacheKey, CACHE_TTL);
		}

		// Trigger update with the list as JSON or just trigger?
		// ConfigUpdateRegistry expects a string value.
		// We might need to adjust it or just pass JSON for compatibility.
		await ConfigUpdateRegistry.execute(
			guildId,
			key,
			JSON.stringify(values),
		);
	}

	async delete(guildId: string, key: string): Promise<void> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:value:${key}`;
		const listCacheKey = `config:${guildId}:list:${key}`;
		await redis.del(cacheKey);
		await redis.del(listCacheKey);

		this.logger.log(`Config deleted [${guildId}]: ${key}`);

		try {
			await this.prisma.configuration.deleteMany({
				where: { guildId, key },
			});
			await ConfigUpdateRegistry.execute(guildId, key, null);
		} catch {
			// Ignore if not found
		}
	}

	async getChannel(guildId: string, key: string): Promise<string | null> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:channel:${key}`;
		const cached = await redis.get(cacheKey);
		if (cached) return cached;

		const config = await this.prisma.channelConfiguration.findFirst({
			where: {
				key,
				Channel: { guildId },
			},
		});
		const value = config?.channelId ?? null;

		if (value) await redis.set(cacheKey, value, "EX", CACHE_TTL);

		return value;
	}

	async setChannel(
		guildId: string,
		key: string,
		channelId: string,
		channelType: ChannelType = ChannelType.TEXT,
	): Promise<void> {
		await this.entityService.ensureGuildById(guildId);
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:channel:${key}`;
		const channelsCacheKey = `config:${guildId}:channels:${key}`;
		await redis.del(cacheKey);
		await redis.del(channelsCacheKey);

		await this.entityService.ensureChannelById(
			guildId,
			channelId,
			channelType,
		);

		await this.prisma.$transaction([
			this.prisma.channelConfiguration.deleteMany({
				where: {
					key,
					Channel: { guildId },
				},
			}),
			this.prisma.channelConfiguration.create({
				data: { key, channelId },
			}),
		]);
		await redis.set(cacheKey, channelId, "EX", CACHE_TTL);
		await ConfigUpdateRegistry.execute(guildId, key, channelId);
	}

	async getChannels(guildId: string, key: string): Promise<string[]> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:channels:${key}`;
		const cached = await redis.get(cacheKey);
		if (cached) return JSON.parse(cached);

		const configs = await this.prisma.channelConfiguration.findMany({
			where: {
				key,
				Channel: { guildId },
			},
		});
		const values = configs.map((c) => c.channelId);

		await redis.set(cacheKey, JSON.stringify(values), "EX", CACHE_TTL);

		return values;
	}

	async addChannel(
		guildId: string,
		key: string,
		channelId: string,
		channelType: ChannelType = ChannelType.TEXT,
	): Promise<void> {
		await this.entityService.ensureGuildById(guildId);
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:channels:${key}`;
		const channelCacheKey = `config:${guildId}:channel:${key}`;
		await redis.del(cacheKey);
		await redis.del(channelCacheKey);

		await this.entityService.ensureChannelById(
			guildId,
			channelId,
			channelType,
		);

		await this.prisma.channelConfiguration.upsert({
			where: { key_channelId: { key, channelId } },
			update: {},
			create: { key, channelId },
		});
	}

	async removeChannel(
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
			await this.prisma.channelConfiguration.delete({
				where: { key_channelId: { key, channelId } },
			});
		} catch {
			// Ignore if not found
		}
	}

	async getRole(guildId: string, key: string): Promise<string | null> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:role:${key}`;
		const cached = await redis.get(cacheKey);
		if (cached) return cached;

		const config = await this.prisma.roleConfiguration.findFirst({
			where: {
				key,
				Role: { guildId },
			},
		});
		const value = config?.roleId ?? null;

		if (value) await redis.set(cacheKey, value, "EX", CACHE_TTL);

		return value;
	}

	async setRole(guildId: string, key: string, roleId: string): Promise<void> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:role:${key}`;
		const rolesCacheKey = `config:${guildId}:roles:${key}`;
		await redis.del(cacheKey);
		await redis.del(rolesCacheKey);

		await this.ensureRoleExists(roleId, guildId);
		await this.prisma.$transaction([
			this.prisma.roleConfiguration.deleteMany({
				where: {
					key,
					Role: { guildId },
				},
			}),
			this.prisma.roleConfiguration.create({ data: { key, roleId } }),
		]);
		await redis.set(cacheKey, roleId, "EX", CACHE_TTL);
		await ConfigUpdateRegistry.execute(guildId, key, roleId);
	}

	async getRoles(guildId: string, key: string): Promise<string[]> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:roles:${key}`;
		const cached = await redis.get(cacheKey);
		if (cached) return JSON.parse(cached);

		const configs = await this.prisma.roleConfiguration.findMany({
			where: {
				key,
				Role: { guildId },
			},
		});
		const values = configs.map((c) => c.roleId);

		await redis.set(cacheKey, JSON.stringify(values), "EX", CACHE_TTL);

		return values;
	}

	async setRoles(
		guildId: string,
		key: string,
		roleIds: string[],
	): Promise<void> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:roles:${key}`;
		const roleCacheKey = `config:${guildId}:role:${key}`;
		await redis.del(cacheKey);
		await redis.del(roleCacheKey);

		await this.prisma.$transaction(async (tx) => {
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

	async addRole(guildId: string, key: string, roleId: string): Promise<void> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:roles:${key}`;
		const roleCacheKey = `config:${guildId}:role:${key}`;
		await redis.del(cacheKey);
		await redis.del(roleCacheKey);

		await this.ensureRoleExists(roleId, guildId);
		await this.prisma.roleConfiguration.upsert({
			where: { key_roleId: { key, roleId } },
			update: {},
			create: { key, roleId },
		});
	}

	async removeRole(
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
			await this.prisma.roleConfiguration.delete({
				where: { key_roleId: { key, roleId } },
			});
		} catch {
			// Ignore if not found
		}
	}

	async deleteRole(guildId: string, key: string): Promise<void> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:role:${key}`;
		const rolesCacheKey = `config:${guildId}:roles:${key}`;
		await redis.del(cacheKey);
		await redis.del(rolesCacheKey);

		await this.prisma.roleConfiguration.deleteMany({
			where: {
				key,
				Role: { guildId },
			},
		});
		await ConfigUpdateRegistry.execute(guildId, key, null);
	}

	async deleteChannel(guildId: string, key: string): Promise<void> {
		const redis = RedisService.getInstance();
		const cacheKey = `config:${guildId}:channel:${key}`;
		const channelsCacheKey = `config:${guildId}:channels:${key}`;
		await redis.del(cacheKey);
		await redis.del(channelsCacheKey);

		await this.prisma.channelConfiguration.deleteMany({
			where: {
				key,
				Channel: { guildId },
			},
		});
		await ConfigUpdateRegistry.execute(guildId, key, null);
	}

	async getAll(guildId: string): Promise<Record<string, string>> {
		const [configs, channelConfigs, roleConfigs] = await Promise.all([
			this.prisma.configuration.findMany({ where: { guildId } }),
			this.prisma.channelConfiguration.findMany({
				where: { Channel: { guildId } },
			}),
			this.prisma.roleConfiguration.findMany({
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
