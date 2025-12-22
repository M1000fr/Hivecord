import type { GeneralConfig } from "./GeneralConfig";

/**
 * Type-safe configuration keys for GeneralConfig
 * Each key specifies:
 * - key: the property name
 * - hasDefault: whether the property has a default value (affects optionality)
 */
export const GeneralConfigKey = {
	Language: {
		key: "generalLanguage" as keyof GeneralConfig,
		hasDefault: true,
	},
	WelcomeMessageImage: {
		key: "generalWelcomeMessageImage" as keyof GeneralConfig,
		hasDefault: true,
	},
	WelcomeMessage: {
		key: "generalWelcomeMessage" as keyof GeneralConfig,
		hasDefault: true,
	},
	WelcomeChannelId: {
		key: "generalWelcomeChannelId" as keyof GeneralConfig,
		hasDefault: false, // Empty string is not a valid channel ID
	},
	WelcomeEmbedName: {
		key: "generalWelcomeEmbedName" as keyof GeneralConfig,
		hasDefault: false, // Empty string means no embed
	},
	WelcomeRoles: {
		key: "generalWelcomeRoles" as keyof GeneralConfig,
		hasDefault: true, // Empty array is a valid default
	},
	WelcomeBackground: {
		key: "generalWelcomeBackground" as keyof GeneralConfig,
		hasDefault: false, // Empty string means no background
	},
} as const;

export type GeneralConfigKeyType = typeof GeneralConfigKey;
export type GeneralConfigKeyName = keyof GeneralConfigKeyType;
