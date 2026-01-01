import { LeBotClient } from "@class/LeBotClient";
import {
	EConfigType,
	type ConfigKeyMetadata,
	type ConfigPropertyOptions,
	type IConfigClass,
} from "@decorators/ConfigProperty";
import { Inject } from "@decorators/Inject";
import { ChannelConfigService } from "@modules/Configuration/services/ChannelConfigService";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import { RoleConfigService } from "@modules/Configuration/services/RoleConfigService";
import { ConfigTypeRegistry } from "@registers/ConfigTypeRegistry";
import {
	ActionRowBuilder,
	EmbedBuilder,
	Guild,
	Locale,
	Role,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	User,
} from "discord.js";
import type { TFunction } from "i18next";
import { CustomIdHelper } from "./CustomIdHelper";

import { Injectable } from "@decorators/Injectable";

@Injectable()
export class ConfigHelper {
	constructor(
		private readonly configService: ConfigService,
		private readonly roleConfig: RoleConfigService,
		private readonly channelConfig: ChannelConfigService,
		@Inject(LeBotClient) private readonly client: LeBotClient<true>,
	) {}

	static toSnakeCase(str: string): string {
		return str.replace(/[A-Z]/g, (letter, index) =>
			index === 0 ? letter.toLowerCase() : `_${letter.toLowerCase()}`,
		);
	}

	static truncate(str: string, maxLength: number): string {
		return str.length > maxLength
			? `${str.substring(0, maxLength - 3)}...`
			: str;
	}

	static getTypeName(type: EConfigType | string, t: TFunction): string {
		if (typeof type === "string") {
			const customType = ConfigTypeRegistry.get(type);
			if (customType) return customType.name;
			return type;
		}
		const key = `utils.config_helper.types.${EConfigType[type].toLowerCase()}`;
		return t(key, { defaultValue: EConfigType[type] });
	}

	static async formatValue(
		value: string | string[],
		type: EConfigType | string,
		t: TFunction,
		options?: ConfigPropertyOptions,
		locale?: string,
		guildId?: string,
	): Promise<string> {
		if (typeof type === "string") {
			const customType = ConfigTypeRegistry.get(type);
			if (customType?.handler.formatValue && guildId) {
				return customType.handler.formatValue(guildId, value);
			}
			return this.truncate(String(value), 100);
		}
		if (type === EConfigType.Role) return `<@&${value}>`;
		if (type === EConfigType.RoleArray && Array.isArray(value))
			return value.map((v) => `<@&${v}>`).join(", ");
		if (type === EConfigType.StringArray && Array.isArray(value))
			return value.join(", ");
		if (type === EConfigType.Channel) return `<#${value}>`;
		if (type === EConfigType.Boolean)
			return String(value) === "true" ? "`✅`" : "`❌`";
		if (type === EConfigType.StringChoice && options?.choices && locale) {
			const choice = options.choices.find((c) => c.value === value);
			if (choice) {
				return (
					choice.nameLocalizations?.[locale as Locale] || choice.name
				);
			}
		}
		if (type === EConfigType.Attachment) {
			if (!value) return t("common.none");
			const strValue = String(value);
			const fileName = strValue.split(/[/\\]/).pop() || strValue;
			// Remove prefix like module_prop_1234567890123_
			const match = fileName.match(/_\d{13}_/);
			if (match && match.index !== undefined) {
				return fileName.substring(match.index + match[0].length);
			}
			return fileName;
		}
		return this.truncate(String(value), 100);
	}

	async fetchValue(
		guild: Guild,
		key: string,
		type: EConfigType | string,
	): Promise<string | string[] | null> {
		const snakeKey = ConfigHelper.toSnakeCase(key);
		let value: string | string[] | null = null;

		if (type === EConfigType.Role)
			value = await this.configService.getRole(guild, snakeKey);
		else if (type === EConfigType.RoleArray)
			value = await this.configService.getRoleList(guild, snakeKey);
		else if (type === EConfigType.StringArray) {
			value = await this.configService.getMany(guild, snakeKey);
		} else if (type === EConfigType.Channel)
			value = await this.configService.getChannel(guild, snakeKey);
		else value = await this.configService.get(guild, snakeKey);

		return value;
	}

	async saveValue(
		guild: Guild,
		key: string,
		value: string | string[],
		type: EConfigType | string,
	): Promise<void> {
		const snakeKey = ConfigHelper.toSnakeCase(key);
		if (type === EConfigType.Role) {
			const role = await guild.roles.fetch(value as string);
			if (role) return this.configService.setRole(guild, snakeKey, role);
		}
		if (type === EConfigType.RoleArray) {
			const roles: Role[] = [];
			for (const id of value as string[]) {
				const role = await guild.roles.fetch(id);
				if (role) roles.push(role);
			}
			return this.roleConfig.setList(guild, snakeKey, roles);
		}
		if (type === EConfigType.StringArray)
			return this.configService.setMany(
				guild,
				snakeKey,
				value as string[],
			);
		if (type === EConfigType.Channel) {
			const channel = await guild.channels.fetch(value as string);
			if (channel)
				return this.configService.setChannel(guild, snakeKey, channel);
		}
		return this.configService.set(guild, snakeKey, value as string);
	}

	async deleteValue(
		guild: Guild,
		key: string,
		type: EConfigType | string,
	): Promise<void> {
		const snakeKey = ConfigHelper.toSnakeCase(key);
		if (type === EConfigType.Role || type === EConfigType.RoleArray)
			return this.configService.clearRoleList(guild, snakeKey);
		if (type === EConfigType.Channel)
			return this.configService.clearChannelList(guild, snakeKey);
		return this.configService.delete(guild, snakeKey);
	}

	static buildCustomId(parts: string[]): string {
		return CustomIdHelper.build(parts);
	}

	static parseCustomId(customId: string): string[] {
		return CustomIdHelper.parse(customId);
	}

	async getCurrentValue(
		guild: Guild,
		key: string,
		type: EConfigType | string,
		t: TFunction,
		options?: ConfigPropertyOptions,
		locale?: string,
		defaultValue?: unknown,
	): Promise<string> {
		try {
			let value = await this.fetchValue(guild, key, type);

			if (
				value === null ||
				(Array.isArray(value) && value.length === 0)
			) {
				if (defaultValue !== undefined) {
					value = defaultValue as string | string[];
				}
			}

			const isSet =
				value !== null &&
				value !== undefined &&
				value !== "" &&
				(!Array.isArray(value) || value.length > 0);

			if (isSet) {
				return await ConfigHelper.formatValue(
					value as string | string[],
					type,
					t,
					options,
					locale,
					guild.id,
				);
			}

			return t("utils.config_helper.not_set");
		} catch {
			return t("utils.config_helper.not_set");
		}
	}

	async buildModuleConfigEmbed(
		client: LeBotClient<true>,
		guild: Guild,
		moduleName: string,
		user: User,
		t: TFunction,
		locale: string,
	) {
		const module = client.modules.get(moduleName.toLowerCase());
		if (!module?.options.config) return null;

		const configProperties =
			(module.options.config as unknown as IConfigClass)
				.configProperties || {};

		const embed = new EmbedBuilder()
			.setTitle(
				t("utils.config_helper.title", {
					module: module.options.name,
				}),
			)
			.setDescription(
				t("utils.config_helper.description", {
					module: module.options.name,
				}),
			)
			.setColor("#5865F2")
			.setTimestamp();

		for (const [idx, [key, options]] of Object.entries(
			configProperties,
		).entries()) {
			const opt = options;
			const language = locale || "fr";
			const displayName =
				opt.displayNameLocalizations?.[language as Locale] ||
				opt.displayName ||
				key;

			const configClass = module.options.config as unknown as Record<
				string,
				unknown
			>;
			const propertyValue = configClass[key];
			const defaultValue =
				propertyValue &&
				typeof propertyValue === "object" &&
				"__isConfigKey" in propertyValue
					? (propertyValue as unknown as ConfigKeyMetadata)
							.defaultValue
					: undefined;

			const description =
				opt.descriptionLocalizations?.[language as Locale] ||
				opt.description;

			const currentValue = await this.getCurrentValue(
				guild,
				key,
				opt.type,
				t,
				opt,
				language,
				defaultValue,
			);

			embed.addFields({
				name: `${idx + 1}. ${displayName}`,
				value: `${description}\n${t("common.type")}: \`${ConfigHelper.getTypeName(opt.type as EConfigType, t)}\`\n${t("common.current")}: ${currentValue}`,
				inline: true,
			});
		}

		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId(
				ConfigHelper.buildCustomId([
					"module_config",
					moduleName.toLowerCase(),
					user.id,
				]),
			)
			.setPlaceholder(t("utils.config_helper.select_placeholder"))
			.addOptions(
				Object.entries(configProperties).map(([key, options], idx) => {
					const opt = options;
					const language = locale || "fr";
					const displayName =
						opt.displayNameLocalizations?.[language as Locale] ||
						opt.displayName ||
						key;
					const description =
						opt.descriptionLocalizations?.[language as Locale] ||
						opt.description;

					return new StringSelectMenuOptionBuilder()
						.setLabel(`${idx + 1}. ${displayName}`)
						.setDescription(ConfigHelper.truncate(description, 100))
						.setValue(key);
				}),
			);

		return {
			embed,
			row: new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
				selectMenu,
			),
		};
	}
}
