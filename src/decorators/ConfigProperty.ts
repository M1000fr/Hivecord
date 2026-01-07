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
	RoleArray = 101,
	StringChoice = 102,
	StringArray = 103,
	ChannelArray = 104,
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
	type: EConfigType | string; // Support both enum and custom type IDs
	required?: boolean;
	choices?: ConfigChoice[];
	nonNull?: boolean;
	emoji?: string;
}

export interface IConfigClass {
	configProperties?: Record<string, ConfigPropertyOptions>;
}

export interface ConfigKeyMetadata<T = unknown> {
	__isConfigKey: true;
	defaultValue?: T;
}

/**
 * Helper to define a config key with a default value.
 * Returns the default value at compile time but an object with metadata at runtime.
 */
export function configKey<T>(defaultValue?: T): T {
	return {
		__isConfigKey: true,
		defaultValue,
	} as unknown as T;
}

export function ConfigProperty(options: ConfigPropertyOptions) {
	return (target: object, propertyKey: string) => {
		const isStatic = typeof target === "function";
		const constructor = (isStatic
			? target
			: target.constructor) as unknown as {
			configProperties?: Record<string, ConfigPropertyOptions>;
		};

		if (!constructor.configProperties) {
			constructor.configProperties = {};
		}
		constructor.configProperties[propertyKey] = options;

		// If the property was initialized with configKey(), attach metadata to it
		const val = (target as Record<string, unknown>)[propertyKey];
		if (
			val &&
			typeof val === "object" &&
			(val as Record<string, unknown>).__isConfigKey
		) {
			const configKeyVal = val as unknown as {
				configClass?: unknown;
				propertyKey?: string;
				options?: ConfigPropertyOptions;
			};
			configKeyVal.configClass = constructor;
			configKeyVal.propertyKey = propertyKey;
			configKeyVal.options = options;
		}
	};
}

/**
 * Converts a camelCase or PascalCase property name to snake_case for config keys
 * @param key - The property name
 * @returns The config key in snake_case
 */
export function toConfigKey(key: string): string {
	return key.replace(/[A-Z]/g, (letter, index) =>
		index === 0 ? letter.toLowerCase() : `_${letter.toLowerCase()}`,
	);
}

export type ConfigKey<T> = string & { __type: T };
