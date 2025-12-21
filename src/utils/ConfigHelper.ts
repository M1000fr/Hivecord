import { LeBotClient } from "@class/LeBotClient";
import {
	EConfigType,
	type ConfigPropertyOptions,
} from "@decorators/ConfigProperty";
import { ConfigService } from "@services/ConfigService";
import {
	ActionRowBuilder,
	EmbedBuilder,
	Locale,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from "discord.js";
import type { TFunction } from "i18next";

import { Injectable } from "@decorators/Injectable";

@Injectable()
export class ConfigHelper {
	constructor(private readonly configService: ConfigService) {}

	static toSnakeCase(str: string): string {
		return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
	}

	static truncate(str: string, maxLength: number): string {
		return str.length > maxLength
			? `${str.substring(0, maxLength - 3)}...`
			: str;
	}

	static getTypeName(type: EConfigType, t: TFunction): string {
		const key = `utils.config_helper.types.${EConfigType[type].toLowerCase()}`;
		return t(key, { defaultValue: EConfigType[type] });
	}

	static formatValue(
		value: string | string[],
		type: EConfigType,
		t: TFunction,
		options?: ConfigPropertyOptions,
		locale?: string,
	): string {
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
		guildId: string,
		key: string,
		type: EConfigType,
		defaultValue?: unknown,
	): Promise<string | string[] | null> {
		const snakeKey = ConfigHelper.toSnakeCase(key);
		let value: string | string[] | null = null;

		if (type === EConfigType.Role)
			value = await this.configService.getRole(guildId, snakeKey);
		else if (type === EConfigType.RoleArray)
			value = await this.configService.getRoles(guildId, snakeKey);
		else if (type === EConfigType.StringArray) {
			value = await this.configService.getMany(guildId, snakeKey);
		} else if (type === EConfigType.Channel)
			value = await this.configService.getChannel(guildId, snakeKey);
		else value = await this.configService.get(guildId, snakeKey);

		if (value === null && defaultValue !== undefined) {
			return String(defaultValue);
		}
		return value;
	}

	async saveValue(
		guildId: string,
		key: string,
		value: string | string[],
		type: EConfigType,
	): Promise<void> {
		const snakeKey = ConfigHelper.toSnakeCase(key);
		if (type === EConfigType.Role)
			return this.configService.setRole(
				guildId,
				snakeKey,
				value as string,
			);
		if (type === EConfigType.RoleArray)
			return this.configService.setRoles(
				guildId,
				snakeKey,
				value as string[],
			);
		if (type === EConfigType.StringArray)
			return this.configService.setMany(
				guildId,
				snakeKey,
				value as string[],
			);
		if (type === EConfigType.Channel)
			return this.configService.setChannel(
				guildId,
				snakeKey,
				value as string,
			);
		return this.configService.set(guildId, snakeKey, value as string);
	}

	async deleteValue(
		guildId: string,
		key: string,
		type: EConfigType,
	): Promise<void> {
		const snakeKey = ConfigHelper.toSnakeCase(key);
		if (type === EConfigType.Role)
			return this.configService.deleteRole(guildId, snakeKey);
		if (type === EConfigType.Channel)
			return this.configService.deleteChannel(guildId, snakeKey);
		return this.configService.delete(guildId, snakeKey);
	}

	static buildCustomId(parts: string[]): string {
		return parts.join(":");
	}

	static parseCustomId(customId: string): string[] {
		return customId.split(":");
	}

	async getCurrentValue(
		guildId: string,
		key: string,
		type: EConfigType,
		t: TFunction,
		defaultValue?: unknown,
		options?: ConfigPropertyOptions,
		locale?: string,
	): Promise<string> {
		try {
			const value = await this.fetchValue(
				guildId,
				key,
				type,
				options?.nonNull ? defaultValue : undefined,
			);
			return value
				? ConfigHelper.formatValue(value, type, t, options, locale)
				: t("utils.config_helper.not_set");
		} catch {
			return t("utils.config_helper.not_set");
		}
	}

	async buildModuleConfigEmbed(
		client: LeBotClient<true>,
		guildId: string,
		moduleName: string,
		userId: string,
		t: TFunction,
		locale: string,
	) {
		const module = client.modules.get(moduleName.toLowerCase());
		if (!module?.options.config) return null;

		const configProperties =
			(
				module.options.config as unknown as {
					configProperties: Record<string, ConfigPropertyOptions>;
				}
			).configProperties || {};

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
			const language = locale || "en";
			const displayName =
				opt.displayNameLocalizations?.[language as Locale] ||
				opt.displayName ||
				key;
			const description =
				opt.descriptionLocalizations?.[language as Locale] ||
				opt.description;

			const currentValue = await this.getCurrentValue(
				guildId,
				key,
				opt.type,
				t,
				opt.defaultValue,
				opt,
				language,
			);

			embed.addFields({
				name: `${idx + 1}. ${displayName}`,
				value: `${description}\n${t("utils.config_helper.type")}: \`${ConfigHelper.getTypeName(opt.type as EConfigType, t)}\`\n${t("utils.config_helper.current")}: ${currentValue}`,
				inline: true,
			});
		}

		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId(
				ConfigHelper.buildCustomId([
					"module_config",
					moduleName.toLowerCase(),
					userId,
				]),
			)
			.setPlaceholder(t("utils.config_helper.select_placeholder"))
			.addOptions(
				Object.entries(configProperties).map(([key, options], idx) => {
					const opt = options;
					const language = locale || "en";
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
