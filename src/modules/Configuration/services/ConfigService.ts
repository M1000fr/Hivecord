import {
	EConfigType,
	toConfigKey,
	type ConfigKey,
	type IConfigClass,
} from "@decorators/ConfigProperty";
import { Injectable } from "@decorators/Injectable";
import { EntityService } from "@modules/Core/services/EntityService";
import { PrismaService } from "@modules/Core/services/PrismaService";
import { ChannelType } from "@prisma/client/enums";
import { ConfigUpdateRegistry } from "@registers/ConfigUpdateRegistry";
import { Logger } from "@utils/Logger";
import { ChannelConfigService } from "./ChannelConfigService";
import { ConfigCacheService } from "./ConfigCacheService";
import { RoleConfigService } from "./RoleConfigService";

export type ConfigProxy<T> = {
	[K in keyof T]: Promise<T[K]>;
};

@Injectable()
export class ConfigService {
	private logger = new Logger("ConfigService");

	constructor(
		private readonly entityService: EntityService,
		private readonly prisma: PrismaService,
		private readonly cache: ConfigCacheService,
		private readonly channelConfig: ChannelConfigService,
		private readonly roleConfig: RoleConfigService,
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
						return this.channelConfig.get(guildId, key);
					case EConfigType.Role:
						return this.roleConfig.get(guildId, key);
					case EConfigType.RoleArray:
						return this.roleConfig.getList(guildId, key);
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
		return this.cache.get(guildId, "value", key, async () => {
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

		await this.cache.invalidate(guildId, key);
		await this.notifyUpdate(guildId, key, value);
	}

	async getMany(guildId: string, key: string): Promise<string[]> {
		return this.cache.get(
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

		await this.cache.invalidate(guildId, key);
		await this.notifyUpdate(guildId, key, JSON.stringify(values), true);
	}

	async delete(guildId: string, key: string): Promise<void> {
		try {
			await this.prisma.configuration.deleteMany({
				where: { guildId, key },
			});
			await this.cache.invalidate(guildId, key);
			await this.notifyUpdate(guildId, key, null);
		} catch {
			// Ignore if not found
		}
	}

	async getChannel(guildId: string, key: string): Promise<string | null> {
		return this.channelConfig.get(guildId, key);
	}

	async setChannel(
		guildId: string,
		key: string,
		channelId: string,
		channelType: ChannelType = ChannelType.TEXT,
	): Promise<void> {
		await this.channelConfig.set(guildId, key, channelId, channelType);
		await this.notifyUpdate(guildId, key, channelId);
	}

	async getChannelList(guildId: string, key: string): Promise<string[]> {
		return this.channelConfig.getList(guildId, key);
	}

	async addChannelToList(
		guildId: string,
		key: string,
		channelId: string,
		channelType: ChannelType = ChannelType.TEXT,
	): Promise<void> {
		await this.channelConfig.addToList(
			guildId,
			key,
			channelId,
			channelType,
		);
	}

	async removeChannelFromList(
		guildId: string,
		key: string,
		channelId: string,
	): Promise<void> {
		await this.channelConfig.removeFromList(guildId, key, channelId);
	}

	async deleteChannel(
		guildId: string,
		key: string,
		channelId: string,
	): Promise<void> {
		await this.channelConfig.delete(guildId, key, channelId);
		await this.notifyUpdate(guildId, key, null);
	}

	async clearChannelList(guildId: string, key: string): Promise<void> {
		await this.channelConfig.clearList(guildId, key);
		await this.notifyUpdate(guildId, key, null);
	}

	async getRole(guildId: string, key: string): Promise<string | null> {
		return this.roleConfig.get(guildId, key);
	}

	async setRole(guildId: string, key: string, roleId: string): Promise<void> {
		await this.roleConfig.set(guildId, key, roleId);
		await this.notifyUpdate(guildId, key, roleId);
	}

	async getRoleList(guildId: string, key: string): Promise<string[]> {
		return this.roleConfig.getList(guildId, key);
	}

	async setRoleList(
		guildId: string,
		key: string,
		roleIds: string[],
	): Promise<void> {
		await this.roleConfig.setList(guildId, key, roleIds);
	}

	async addRoleToList(
		guildId: string,
		key: string,
		roleId: string,
	): Promise<void> {
		await this.roleConfig.addToList(guildId, key, roleId);
	}

	async removeRoleFromList(
		guildId: string,
		key: string,
		roleId: string,
	): Promise<void> {
		await this.roleConfig.removeFromList(guildId, key, roleId);
	}

	async deleteRole(
		guildId: string,
		key: string,
		roleId: string,
	): Promise<void> {
		await this.roleConfig.delete(guildId, key, roleId);
		await this.notifyUpdate(guildId, key, null);
	}

	async clearRoleList(guildId: string, key: string): Promise<void> {
		await this.roleConfig.clearList(guildId, key);
		await this.notifyUpdate(guildId, key, null);
	}

	async getAll(guildId: string): Promise<Record<string, string>> {
		const [
			configs,
			channelConfigs,
			channelListConfigs,
			roleConfigs,
			roleListConfigs,
		] = await Promise.all([
			this.prisma.configuration.findMany({ where: { guildId } }),
			this.prisma.channelConfiguration.findMany({
				where: { Channel: { guildId } },
			}),
			this.prisma.channelListConfiguration.findMany({
				where: { Channel: { guildId } },
			}),
			this.prisma.roleConfiguration.findMany({
				where: { Role: { guildId } },
			}),
			this.prisma.roleListConfiguration.findMany({
				where: { Role: { guildId } },
			}),
		]);

		return {
			...Object.fromEntries(configs.map((c) => [c.key, c.value])),
			...Object.fromEntries(
				channelConfigs.map((c) => [c.key, c.channelId]),
			),
			...Object.fromEntries(
				channelListConfigs.map((c) => [c.key, c.channelId]),
			),
			...Object.fromEntries(roleConfigs.map((c) => [c.key, c.roleId])),
			...Object.fromEntries(
				roleListConfigs.map((c) => [c.key, c.roleId]),
			),
		};
	}
}
