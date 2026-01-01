import {
	type ConfigKey,
	type ConfigKeyMetadata,
	EConfigType,
	type IConfigClass,
	toConfigKey,
} from "@decorators/ConfigProperty";
import { Injectable } from "@decorators/Injectable";
import { GeneralConfig } from "@modules/General/GeneralConfig";
import { ChannelType } from "@prisma/client/enums";
import { ConfigUpdateRegistry } from "@registers/ConfigUpdateRegistry";
import { ConfigurationRepository, GuildRepository } from "@src/repositories";
import { Logger } from "@utils/Logger";
import { type Channel, Guild, type GuildBasedChannel, Role } from "discord.js";
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
		private readonly guildRepository: GuildRepository,
		private readonly configurationRepository: ConfigurationRepository,
		private readonly cache: ConfigCacheService,
		private readonly channelConfig: ChannelConfigService,
		private readonly roleConfig: RoleConfigService,
	) {}

	async getLanguage(guild: Guild): Promise<string> {
		return (await this.of(guild, GeneralConfig).Language) || "fr";
	}

	of<T>(guild: Guild, configClass: T): ConfigProxy<T> {
		const metadata = (configClass as unknown as IConfigClass)
			.configProperties;

		return new Proxy({} as ConfigProxy<T>, {
			get: (_target, prop) => {
				if (typeof prop !== "string") return undefined;
				const key = toConfigKey(prop);
				const options = metadata?.[prop];

				// Get default value
				const propertyValue = (configClass as Record<string, unknown>)[
					prop
				];
				const defaultValue =
					propertyValue &&
					typeof propertyValue === "object" &&
					"__isConfigKey" in propertyValue
						? (propertyValue as unknown as ConfigKeyMetadata)
								.defaultValue
						: undefined;

				if (!options) {
					return this.get(guild, key).then((v) => v ?? defaultValue);
				}

				switch (options.type) {
					case EConfigType.Channel:
						return this.channelConfig
							.get(guild, key)
							.then((v) => v ?? defaultValue);
					case EConfigType.Role:
						return this.roleConfig
							.get(guild, key)
							.then((v) => v ?? defaultValue);
					case EConfigType.RoleArray:
						return this.roleConfig
							.getList(guild, key)
							.then((v) =>
								v && v.length > 0 ? v : (defaultValue ?? []),
							);
					case EConfigType.StringArray:
						return this.getMany(guild, key).then((v) =>
							v && v.length > 0 ? v : (defaultValue ?? []),
						);
					case EConfigType.Integer:
					case EConfigType.Number:
						return this.get(guild, key).then((v) =>
							v !== null ? Number(v) : defaultValue,
						);
					case EConfigType.Boolean:
						return this.get(guild, key).then((v) =>
							v !== null ? v === "true" : defaultValue,
						);
					default:
						return this.get(guild, key).then(
							(v) => v ?? defaultValue,
						);
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
		guild: Guild,
		key: ConfigKey<T> | string,
	): Promise<T> {
		return this.cache.get(guild.id, "value", key, async () => {
			const config = await this.configurationRepository.get(guild, key);
			const value = config?.value ?? null;
			return value as T;
		});
	}

	async set(guild: Guild, key: string, value: string): Promise<void> {
		await this.guildRepository.upsert(guild);

		await this.configurationRepository.set(guild, key, value);

		await this.cache.invalidate(guild.id, key);
		await this.notifyUpdate(guild.id, key, value);
	}

	async getMany(guild: Guild, key: string): Promise<string[]> {
		return this.cache.get(
			guild.id,
			"list",
			key,
			async () => {
				const configs = await this.configurationRepository.getMany(
					guild,
					key,
				);
				return configs.map((c) => c.value);
			},
			true,
		);
	}

	async setMany(guild: Guild, key: string, values: string[]): Promise<void> {
		await this.guildRepository.upsert(guild);

		await this.configurationRepository.setMany(guild, key, values);

		await this.cache.invalidate(guild.id, key);
		await this.notifyUpdate(guild.id, key, JSON.stringify(values), true);
	}

	async delete(guild: Guild, key: string): Promise<void> {
		try {
			await this.configurationRepository.delete(guild, key);
			await this.cache.invalidate(guild.id, key);
			await this.notifyUpdate(guild.id, key, null);
		} catch {
			// Ignore if not found
		}
	}

	async getChannel(guild: Guild, key: string): Promise<string | null> {
		return this.channelConfig.get(guild, key);
	}

	async setChannel(
		guild: Guild,
		key: string,
		channel: GuildBasedChannel,
		channelType: ChannelType = ChannelType.TEXT,
	): Promise<void> {
		await this.channelConfig.set(guild, key, channel, channelType);
		await this.notifyUpdate(guild.id, key, channel.id);
	}

	async deleteChannel(
		guild: Guild,
		key: string,
		channel: Channel,
	): Promise<void> {
		await this.channelConfig.delete(guild, key, channel);
		await this.notifyUpdate(guild.id, key, null);
	}

	async clearChannelList(guild: Guild, key: string): Promise<void> {
		await this.channelConfig.clearList(guild, key);
		await this.notifyUpdate(guild.id, key, null);
	}

	async getRole(guild: Guild, key: string): Promise<string | null> {
		return this.roleConfig.get(guild, key);
	}

	async setRole(guild: Guild, key: string, role: Role): Promise<void> {
		await this.roleConfig.set(guild, key, role);
		await this.notifyUpdate(guild.id, key, role.id);
	}

	async getRoleList(guild: Guild, key: string): Promise<string[]> {
		return this.roleConfig.getList(guild, key);
	}

	async deleteRole(guild: Guild, key: string, roleId: string): Promise<void> {
		await this.roleConfig.delete(guild, key, roleId);
		await this.notifyUpdate(guild.id, key, null);
	}

	async clearRoleList(guild: Guild, key: string): Promise<void> {
		await this.roleConfig.clearList(guild, key);
		await this.notifyUpdate(guild.id, key, null);
	}

	async getAll(guild: Guild): Promise<Record<string, string>> {
		const {
			configs,
			channelConfigs,
			channelListConfigs,
			roleConfigs,
			roleListConfigs,
		} = await this.configurationRepository.getAllConfigs(guild.id);

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
