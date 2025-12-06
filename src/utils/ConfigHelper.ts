import { LeBotClient } from "@class/LeBotClient";
import {
	EConfigType,
	type ConfigPropertyOptions,
} from "@decorators/ConfigProperty";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import {
	ActionRowBuilder,
	EmbedBuilder,
	Locale,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from "discord.js";
import type { TFunction } from "i18next";

export class ConfigHelper {
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

	static async fetchValue(
		guildId: string,
		key: string,
		type: EConfigType,
		defaultValue?: unknown,
	): Promise<string | string[] | null> {
		const snakeKey = this.toSnakeCase(key);
		let value: string | string[] | null = null;

		if (type === EConfigType.Role)
			value = await ConfigService.getRole(guildId, snakeKey);
		else if (type === EConfigType.RoleArray)
			value = await ConfigService.getRoles(guildId, snakeKey);
		else if (type === EConfigType.Channel)
			value = await ConfigService.getChannel(guildId, snakeKey);
		else value = await ConfigService.get(guildId, snakeKey);

		if (value === null && defaultValue !== undefined) {
			return String(defaultValue);
		}
		return value;
	}

	static async saveValue(
		guildId: string,
		key: string,
		value: string | string[],
		type: EConfigType,
	): Promise<void> {
		const snakeKey = this.toSnakeCase(key);
		if (type === EConfigType.Role)
			return ConfigService.setRole(guildId, snakeKey, value as string);
		if (type === EConfigType.RoleArray)
			return ConfigService.setRoles(guildId, snakeKey, value as string[]);
		if (type === EConfigType.Channel)
			return ConfigService.setChannel(guildId, snakeKey, value as string);
		return ConfigService.set(guildId, snakeKey, value as string);
	}

	static async deleteValue(
		guildId: string,
		key: string,
		type: EConfigType,
	): Promise<void> {
		const snakeKey = this.toSnakeCase(key);
		if (type === EConfigType.Role)
			return ConfigService.deleteRole(guildId, snakeKey);
		if (type === EConfigType.Channel)
			return ConfigService.deleteChannel(guildId, snakeKey);
		return ConfigService.delete(guildId, snakeKey);
	}

	static buildCustomId(parts: string[]): string {
		return parts.join(":");
	}

	static parseCustomId(customId: string): string[] {
		return customId.split(":");
	}

	static async getCurrentValue(
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
				? this.formatValue(value, type, t, options, locale)
				: t("utils.config_helper.not_set");
		} catch {
			return t("utils.config_helper.not_set");
		}
	}

	static async buildModuleConfigEmbed(
		client: LeBotClient<true>,
		guildId: string,
		moduleName: string,
		userId: string,
		locale: string,
	) {
		const t = I18nService.getFixedT(locale);
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
			const displayName =
				opt.displayNameLocalizations?.[locale as Locale] ||
				opt.displayName ||
				key;
			const description =
				opt.descriptionLocalizations?.[locale as Locale] ||
				opt.description;

			const currentValue = await this.getCurrentValue(
				guildId,
				key,
				opt.type,
				t,
				opt.defaultValue,
				opt,
				locale,
			);

			embed.addFields({
				name: `${idx + 1}. ${displayName}`,
				value: `${description}\n${t("utils.config_helper.type")}: \`${this.getTypeName(opt.type as EConfigType, t)}\`\n${t("utils.config_helper.current")}: ${currentValue}`,
				inline: true,
			});
		}

		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId(
				this.buildCustomId([
					"module_config",
					moduleName.toLowerCase(),
					userId,
				]),
			)
			.setPlaceholder(t("utils.config_helper.select_placeholder"))
			.addOptions(
				Object.entries(configProperties).map(([key, options], idx) => {
					const opt = options;
					const displayName =
						opt.displayNameLocalizations?.[locale as Locale] ||
						opt.displayName ||
						key;
					const description =
						opt.descriptionLocalizations?.[locale as Locale] ||
						opt.description;

					return new StringSelectMenuOptionBuilder()
						.setLabel(`${idx + 1}. ${displayName}`)
						.setDescription(this.truncate(description, 100))
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
