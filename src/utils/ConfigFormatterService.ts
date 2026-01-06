import {
	EConfigType,
	type ConfigPropertyOptions,
} from "@decorators/ConfigProperty";
import { Injectable } from "@decorators/Injectable";
import { ConfigTypeRegistry } from "@registers/ConfigTypeRegistry";
import { Locale } from "discord.js";
import type { TFunction } from "i18next";

/**
 * Handles formatting of configuration values for display.
 * Converts internal values to user-friendly formatted strings.
 */
@Injectable({ scope: "global" })
export class ConfigFormatterService {
	/**
	 * Truncate string to maxLength with ellipsis
	 */
	static truncate(str: string, maxLength: number = 100): string {
		return str.length > maxLength
			? `${str.substring(0, maxLength - 3)}...`
			: str;
	}

	/**
	 * Get localized display name for a config type
	 */
	static getTypeName(type: EConfigType | string, t: TFunction): string {
		if (typeof type === "string") {
			const customType = ConfigTypeRegistry.get(type);
			if (customType) return customType.name;
			return type;
		}
		const key = `utils.config_helper.types.${EConfigType[type].toLowerCase()}`;
		return t(key, { defaultValue: EConfigType[type] });
	}

	/**
	 * Format a configuration value for display
	 */
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
			return ConfigFormatterService.truncate(String(value), 100);
		}
		if (type === EConfigType.Role) return `<@&${value}>`;
		if (type === EConfigType.RoleArray && Array.isArray(value))
			return value.map((v) => `<@&${v}>`).join(", ");
		if (type === EConfigType.StringArray && Array.isArray(value))
			return value.join(", ");
		if (type === EConfigType.Channel) return `<#${value}>`;
		if (type === EConfigType.ChannelArray && Array.isArray(value))
			return value.map((v) => `<#${v}>`).join(", ");
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
		return ConfigFormatterService.truncate(String(value), 100);
	}
}
