import {
	EConfigType,
	toConfigKey,
	type ConfigKey,
	type IConfigClass,
} from "@decorators/ConfigProperty";
import { Injectable } from "@decorators/Injectable";
import { EntityService } from "@modules/Core/services/EntityService";
import { PrismaService } from "@modules/Core/services/PrismaService";
import { RedisService } from "@modules/Core/services/RedisService";
import { ChannelType } from "@prisma/client/enums";
import { ConfigUpdateRegistry } from "@registers/ConfigUpdateRegistry";
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
		private readonly redis: RedisService,
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

	private getCacheKey(
		guildId: string,
		type: "value" | "list" | "channel" | "channels" | "role" | "roles",
		key: string,
	): string {
		return `config:${guildId}:${type}:${key}`;
	}

	private async getCached<T>(
		guildId: string,
		type: "value" | "list" | "channel" | "channels" | "role" | "roles",
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

	private async invalidateCache(guildId: string, key: string): Promise<void> {
		const redis = this.redis.client;
		const types: (
			| "value"
			| "list"
			| "channel"
			| "channels"
			| "role"
			| "roles"
		)[] = ["value", "list", "channel", "channels", "role", "roles"];
		const keys = types.map((type) => this.getCacheKey(guildId, type, key));
		await redis.del(...keys);
	}

	private async notifyUpdate(
		guildId: string,
		key: string,
		value: string | null,
		isList = false,
	): Promise<void> {
		this.logger.log(
			`Config ${isList ? "list " : ""}updated [${guildId}]: ${key} = ${value}`,
		);
		await ConfigUpdateRegistry.execute(guildId, key, value);
	}

	async get<T extends string | null = string | null>(
		guildId: string,
		key: ConfigKey<T> | string,
	): Promise<T> {
		return this.getCached(guildId, "value", key, async () => {
			const config = await this.prisma.configuration.findFirst({
				where: { guildId, key },
			});
			const value = config?.value ?? null;
			return value as T;
		});
	}

	async set(guildId: string, key: string, value: string): Promise<void> {
		await this.entityService.ensureGuildById(guildId);

		// Ensure only one value exists for this key
		await this.prisma.configuration.deleteMany({
			where: { guildId, key },
		});
		await this.prisma.configuration.create({
			data: { guildId, key, value },
		});

		await this.invalidateCache(guildId, key);
		await this.notifyUpdate(guildId, key, value);
	}

	async getMany(guildId: string, key: string): Promise<string[]> {
		return this.getCached(
			guildId,
			"list",
			key,
			async () => {
				const configs = await this.prisma.configuration.findMany({
					where: { guildId, key },
					orderBy: { id: "asc" },
				});
				return configs.map((c) => c.value);
			},
			true,
		);
	}

	async setMany(
		guildId: string,
		key: string,
		values: string[],
	): Promise<void> {
		await this.entityService.ensureGuildById(guildId);

		await this.prisma.configuration.deleteMany({
			where: { guildId, key },
		});

		if (values.length > 0) {
			await this.prisma.configuration.createMany({
				data: values.map((value) => ({ guildId, key, value })),
			});
		}

		await this.invalidateCache(guildId, key);
		await this.notifyUpdate(guildId, key, JSON.stringify(values), true);
	}

	async delete(guildId: string, key: string): Promise<void> {
		try {
			await this.prisma.configuration.deleteMany({
				where: { guildId, key },
			});
			await this.invalidateCache(guildId, key);
			await this.notifyUpdate(guildId, key, null);
		} catch {
			// Ignore if not found
		}
	}

	async getChannel(guildId: string, key: string): Promise<string | null> {
		return this.getCached(guildId, "channel", key, async () => {
			const config = await this.prisma.channelConfiguration.findFirst({
				where: {
					key,
					Channel: { guildId },
				},
			});
			return config?.channelId ?? null;
		});
	}

	async setChannel(
		guildId: string,
		key: string,
		channelId: string,
		channelType: ChannelType = ChannelType.TEXT,
	): Promise<void> {
		await this.entityService.ensureGuildById(guildId);
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

		await this.invalidateCache(guildId, key);
		await this.notifyUpdate(guildId, key, channelId);
	}

	async getChannels(guildId: string, key: string): Promise<string[]> {
		return this.getCached(guildId, "channels", key, async () => {
			const configs = await this.prisma.channelConfiguration.findMany({
				where: {
					key,
					Channel: { guildId },
				},
			});
			return configs.map((c) => c.channelId);
		});
	}

	async addChannel(
		guildId: string,
		key: string,
		channelId: string,
		channelType: ChannelType = ChannelType.TEXT,
	): Promise<void> {
		await this.entityService.ensureGuildById(guildId);
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

		await this.invalidateCache(guildId, key);
	}

	async removeChannel(
		guildId: string,
		key: string,
		channelId: string,
	): Promise<void> {
		try {
			await this.prisma.channelConfiguration.delete({
				where: { key_channelId: { key, channelId } },
			});
			await this.invalidateCache(guildId, key);
		} catch {
			// Ignore if not found
		}
	}

	async getRole(guildId: string, key: string): Promise<string | null> {
		return this.getCached(guildId, "role", key, async () => {
			const config = await this.prisma.roleConfiguration.findFirst({
				where: {
					key,
					Role: { guildId },
				},
			});
			return config?.roleId ?? null;
		});
	}

	async setRole(guildId: string, key: string, roleId: string): Promise<void> {
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

		await this.invalidateCache(guildId, key);
		await this.notifyUpdate(guildId, key, roleId);
	}

	async getRoles(guildId: string, key: string): Promise<string[]> {
		return this.getCached(guildId, "roles", key, async () => {
			const configs = await this.prisma.roleConfiguration.findMany({
				where: {
					key,
					Role: { guildId },
				},
			});
			return configs.map((c) => c.roleId);
		});
	}

	async setRoles(
		guildId: string,
		key: string,
		roleIds: string[],
	): Promise<void> {
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

		await this.invalidateCache(guildId, key);
	}

	async addRole(guildId: string, key: string, roleId: string): Promise<void> {
		await this.ensureRoleExists(roleId, guildId);
		await this.prisma.roleConfiguration.upsert({
			where: { key_roleId: { key, roleId } },
			update: {},
			create: { key, roleId },
		});

		await this.invalidateCache(guildId, key);
	}

	async removeRole(
		guildId: string,
		key: string,
		roleId: string,
	): Promise<void> {
		try {
			await this.prisma.roleConfiguration.delete({
				where: { key_roleId: { key, roleId } },
			});
			await this.invalidateCache(guildId, key);
		} catch {
			// Ignore if not found
		}
	}

	async deleteRole(guildId: string, key: string): Promise<void> {
		await this.prisma.roleConfiguration.deleteMany({
			where: {
				key,
				Role: { guildId },
			},
		});

		await this.invalidateCache(guildId, key);
		await this.notifyUpdate(guildId, key, null);
	}

	async deleteChannel(guildId: string, key: string): Promise<void> {
		await this.prisma.channelConfiguration.deleteMany({
			where: {
				key,
				Channel: { guildId },
			},
		});

		await this.invalidateCache(guildId, key);
		await this.notifyUpdate(guildId, key, null);
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
