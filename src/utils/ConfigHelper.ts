import { LeBotClient } from "@class/LeBotClient";
import { EConfigType } from "@decorators/ConfigProperty";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import {
	ActionRowBuilder,
	EmbedBuilder,
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
		options?: any,
		locale?: string,
	): string {
		if (type === EConfigType.Role) return `<@&${value}>`;
		if (type === EConfigType.RoleArray && Array.isArray(value))
			return value.map((v) => `<@&${v}>`).join(", ");
		if (type === EConfigType.Channel) return `<#${value}>`;
		if (type === EConfigType.Boolean)
			return value === "true" ? "`✅`" : "`❌`";
		if (type === EConfigType.StringChoice && options?.choices && locale) {
			const choice = options.choices.find((c: any) => c.value === value);
			if (choice) {
				return choice.nameLocalizations?.[locale] || choice.name;
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
		key: string,
		type: EConfigType,
		defaultValue?: any,
	): Promise<string | string[] | null> {
		const snakeKey = this.toSnakeCase(key);
		let value: string | string[] | null = null;

		if (type === EConfigType.Role)
			value = await ConfigService.getRole(snakeKey);
		else if (type === EConfigType.RoleArray)
			value = await ConfigService.getRoles(snakeKey);
		else if (type === EConfigType.Channel)
			value = await ConfigService.getChannel(snakeKey);
		else value = await ConfigService.get(snakeKey);

		if (value === null && defaultValue !== undefined) {
			return defaultValue;
		}
		return value;
	}

	static async saveValue(
		key: string,
		value: string | string[],
		type: EConfigType,
	): Promise<void> {
		const snakeKey = this.toSnakeCase(key);
		if (type === EConfigType.Role)
			return ConfigService.setRole(snakeKey, value as string);
		if (type === EConfigType.RoleArray)
			return ConfigService.setRoles(snakeKey, value as string[]);
		if (type === EConfigType.Channel)
			return ConfigService.setChannel(snakeKey, value as string);
		return ConfigService.set(snakeKey, value as string);
	}

	static async deleteValue(key: string, type: EConfigType): Promise<void> {
		const snakeKey = this.toSnakeCase(key);
		if (type === EConfigType.Role || type === EConfigType.RoleArray)
			return ConfigService.deleteRole(snakeKey);
		if (type === EConfigType.Channel)
			return ConfigService.deleteChannel(snakeKey);
		return ConfigService.delete(snakeKey);
	}

	static buildCustomId(parts: string[]): string {
		return parts.join(":");
	}

	static parseCustomId(customId: string): string[] {
		return customId.split(":");
	}

	static async getCurrentValue(
		key: string,
		type: EConfigType,
		t: TFunction,
		defaultValue?: any,
		options?: any,
		locale?: string,
	): Promise<string> {
		try {
			const value = await this.fetchValue(key, type, defaultValue);
			return value
				? this.formatValue(value, type, t, options, locale)
				: t("utils.config_helper.not_set");
		} catch {
			return t("utils.config_helper.not_set");
		}
	}

	static async buildModuleConfigEmbed(
		client: LeBotClient<true>,
		moduleName: string,
		userId: string,
		locale: string,
	) {
		const t = I18nService.getFixedT(locale);
		const module = client.modules.get(moduleName.toLowerCase());
		if (!module?.options.config) return null;

		const configProperties =
			(module.options.config as any).configProperties || {};

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
			const opt = options as any;
			const displayName =
				opt.displayNameLocalizations?.[locale] ||
				opt.displayName ||
				key;
			const description =
				opt.descriptionLocalizations?.[locale] || opt.description;

			const currentValue = await this.getCurrentValue(
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
					const opt = options as any;
					const displayName =
						opt.displayNameLocalizations?.[locale] ||
						opt.displayName ||
						key;
					const description =
						opt.descriptionLocalizations?.[locale] ||
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
