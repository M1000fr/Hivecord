import { ConfigRegistry } from "@registers/ConfigRegistry";
import { ApplicationCommandOptionType, type LocalizationMap } from "discord.js";

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
	RoleArray = 101,
	StringChoice = 102,
	StringArray = 103,
}

export interface ConfigChoice {
	name: string;
	value: string;
	nameLocalizations?: LocalizationMap;
}

export interface ConfigPropertyOptions {
	displayName?: string;
	displayNameLocalizations?: LocalizationMap;
	description: string;
	descriptionLocalizations?: LocalizationMap;
	type: EConfigType;
	required?: boolean;
	defaultValue?: unknown;
	choices?: ConfigChoice[];
	nonNull?: boolean;
}

export interface IConfigClass {
	configProperties?: Record<string, ConfigPropertyOptions>;
}

export function ConfigProperty(options: ConfigPropertyOptions) {
	return function (target: object, propertyKey: string) {
		const constructor = target.constructor as IConfigClass;
		if (!constructor.configProperties) {
			constructor.configProperties = {};
		}
		constructor.configProperties[propertyKey] = options;

		const key = toConfigKey(propertyKey);
		ConfigRegistry.register(key, options.defaultValue);
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

export type ConfigKey<T> = string & { __type: T };
