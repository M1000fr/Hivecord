import { ApplicationCommandOptionType } from "discord.js";

export interface ConfigPropertyOptions {
    displayName?: string;
    description: string;
    type: ApplicationCommandOptionType;
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
    return key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}
