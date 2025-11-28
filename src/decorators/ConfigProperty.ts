import { ApplicationCommandOptionType } from "discord.js";

export interface ConfigPropertyOptions {
    description: string;
    type: ApplicationCommandOptionType;
    required?: boolean;
}

export function ConfigProperty(options: ConfigPropertyOptions) {
    return function (target: any, propertyKey: string) {
        if (!target.constructor.configProperties) {
            target.constructor.configProperties = {};
        }
        target.constructor.configProperties[propertyKey] = options;
    };
}
