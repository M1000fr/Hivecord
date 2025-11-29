import { ApplicationCommandOptionType, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from "discord.js";
import { ConfigService } from "@services/ConfigService";
import { LeBotClient } from "@class/LeBotClient";

export const TYPE_NAMES: Record<ApplicationCommandOptionType, string> = {
    [ApplicationCommandOptionType.String]: "Text",
    [ApplicationCommandOptionType.Role]: "Role",
    [ApplicationCommandOptionType.Channel]: "Channel",
    [ApplicationCommandOptionType.User]: "User",
    [ApplicationCommandOptionType.Integer]: "Number",
    [ApplicationCommandOptionType.Boolean]: "Boolean",
    [ApplicationCommandOptionType.Subcommand]: "Subcommand",
    [ApplicationCommandOptionType.SubcommandGroup]: "SubcommandGroup",
    [ApplicationCommandOptionType.Number]: "Number",
    [ApplicationCommandOptionType.Mentionable]: "Mentionable",
    [ApplicationCommandOptionType.Attachment]: "Attachment",
};

export class ConfigHelper {
    static toSnakeCase(str: string): string {
        return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    }

    static truncate(str: string, maxLength: number): string {
        return str.length > maxLength ? `${str.substring(0, maxLength - 3)}...` : str;
    }

    static formatValue(value: string, type: ApplicationCommandOptionType): string {
        if (type === ApplicationCommandOptionType.Role) return `<@&${value}>`;
        if (type === ApplicationCommandOptionType.Channel) return `<#${value}>`;
        if (type === ApplicationCommandOptionType.Boolean) return value === "true" ? "`✅`" : "`❌`";
        return this.truncate(value, 100);
    }

    static async fetchValue(key: string, type: ApplicationCommandOptionType, defaultValue?: any): Promise<string | null> {
        const snakeKey = this.toSnakeCase(key);
        let value: string | null = null;

        if (type === ApplicationCommandOptionType.Role) value = await ConfigService.getRole(snakeKey);
        else if (type === ApplicationCommandOptionType.Channel) value = await ConfigService.getChannel(snakeKey);
        else value = await ConfigService.get(snakeKey);

        if (value === null && defaultValue !== undefined) {
            return String(defaultValue);
        }
        return value;
    }

    static async saveValue(key: string, value: string, type: ApplicationCommandOptionType): Promise<void> {
        const snakeKey = this.toSnakeCase(key);
        if (type === ApplicationCommandOptionType.Role) return ConfigService.setRole(snakeKey, value);
        if (type === ApplicationCommandOptionType.Channel) return ConfigService.setChannel(snakeKey, value);
        return ConfigService.set(snakeKey, value);
    }

    static buildCustomId(parts: string[]): string {
        return parts.join(":");
    }

    static parseCustomId(customId: string): string[] {
        return customId.split(":");
    }

    static async getCurrentValue(key: string, type: ApplicationCommandOptionType, defaultValue?: any): Promise<string> {
        try {
            const value = await this.fetchValue(key, type, defaultValue);
            return value ? this.formatValue(value, type) : "*Not set*";
        } catch {
            return "*Not set*";
        }
    }

    static async buildModuleConfigEmbed(client: LeBotClient<true>, moduleName: string) {
        const module = client.modules.get(moduleName.toLowerCase());
        if (!module?.options.config) return null;

        const configProperties = (module.options.config as any).configProperties || {};

        const embed = new EmbedBuilder()
            .setTitle(`⚙️ Configuration: ${module.options.name}`)
            .setDescription(`Select a property to configure for the **${module.options.name}** module.`)
            .setColor("#5865F2")
            .setTimestamp();

        for (const [idx, [key, options]] of Object.entries(configProperties).entries()) {
            const opt = options as any;
            const currentValue = await this.getCurrentValue(key, opt.type, opt.defaultValue);

            embed.addFields({
                name: `${idx + 1}. ${opt.displayName || key}`,
                value: `${opt.description}\nType: \`${TYPE_NAMES[opt.type as ApplicationCommandOptionType] || "Unknown"}\`\nCurrent: ${currentValue}`,
                inline: false,
            });
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(this.buildCustomId(["module_config", moduleName.toLowerCase()]))
            .setPlaceholder("Select a property to configure")
            .addOptions(
                Object.entries(configProperties).map(([key, options], idx) => {
                    const opt = options as any;
                    return new StringSelectMenuOptionBuilder()
                        .setLabel(`${idx + 1}. ${opt.displayName || key}`)
                        .setDescription(this.truncate(opt.description, 100))
                        .setValue(key);
                }),
            );

        return { 
            embed, 
            row: new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu) 
        };
    }
}
