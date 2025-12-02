import { ApplicationCommandOptionType } from "discord.js";

export enum EConfigType {
	String = ApplicationCommandOptionType.String,
	Integer = ApplicationCommandOptionType.Integer,
	Boolean = ApplicationCommandOptionType.Boolean,
	User = ApplicationCommandOptionType.User,
	Channel = ApplicationCommandOptionType.Channel,
	Role = ApplicationCommandOptionType.Role,
	Mentionable = ApplicationCommandOptionType.Mentionable,
	Number = ApplicationCommandOptionType.Number,
	Attachment = ApplicationCommandOptionType.Attachment,
	// Custom types
	CustomEmbed = 100,
}

export interface ConfigPropertyOptions {
	displayName?: string;
	description: string;
	type: EConfigType;
	required?: boolean;
	defaultValue?: any;
}

export function ConfigProperty(options: ConfigPropertyOptions) {
	return function (target: any, propertyKey: string) {
		if (!target.constructor.configProperties) {
			target.constructor.configProperties = {};
		}
		target.constructor.configProperties[propertyKey] = options;
	};
}

/**
 * Converts a camelCase property name to snake_case for config keys
 * @param key - The property name in camelCase
 * @returns The config key in snake_case
 */
export function toConfigKey(key: string): string {
	return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
