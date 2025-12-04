import { LeBotClient } from "@class/LeBotClient";
import { EConfigType } from "@decorators/ConfigProperty";
import { ConfigService } from "@services/ConfigService";
import {
	ActionRowBuilder,
	EmbedBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from "discord.js";

export const TYPE_NAMES: Record<number, string> = {
	[EConfigType.String]: "Text",
	[EConfigType.Role]: "Role",
	[EConfigType.Channel]: "Channel",
	[EConfigType.User]: "User",
	[EConfigType.Integer]: "Number",
	[EConfigType.Boolean]: "Boolean",
	[EConfigType.Number]: "Number",
	[EConfigType.Mentionable]: "Mentionable",
	[EConfigType.Attachment]: "Attachment",
	[EConfigType.CustomEmbed]: "Custom Embed",
	[EConfigType.RoleArray]: "Roles",
};

export class ConfigHelper {
	static toSnakeCase(str: string): string {
		return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
	}

	static truncate(str: string, maxLength: number): string {
		return str.length > maxLength
			? `${str.substring(0, maxLength - 3)}...`
			: str;
	}

	static formatValue(value: string | string[], type: EConfigType): string {
		if (type === EConfigType.Role) return `<@&${value}>`;
		if (type === EConfigType.RoleArray && Array.isArray(value))
			return value.map((v) => `<@&${v}>`).join(", ");
		if (type === EConfigType.Channel) return `<#${value}>`;
		if (type === EConfigType.Boolean)
			return value === "true" ? "`✅`" : "`❌`";
		if (type === EConfigType.Attachment) {
			if (!value) return "None";
			const strValue = String(value);
			return strValue.split(/[/\\]/).pop() || strValue;
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
		defaultValue?: any,
	): Promise<string> {
		try {
			const value = await this.fetchValue(key, type, defaultValue);
			return value ? this.formatValue(value, type) : "*Not set*";
		} catch {
			return "*Not set*";
		}
	}

	static async buildModuleConfigEmbed(
		client: LeBotClient<true>,
		moduleName: string,
		userId: string,
	) {
		const module = client.modules.get(moduleName.toLowerCase());
		if (!module?.options.config) return null;

		const configProperties =
			(module.options.config as any).configProperties || {};

		const embed = new EmbedBuilder()
			.setTitle(`⚙️ Configuration: ${module.options.name}`)
			.setDescription(
				`Select a property to configure for the **${module.options.name}** module.`,
			)
			.setColor("#5865F2")
			.setTimestamp();

		for (const [idx, [key, options]] of Object.entries(
			configProperties,
		).entries()) {
			const opt = options as any;
			const currentValue = await this.getCurrentValue(
				key,
				opt.type,
				opt.defaultValue,
			);

			embed.addFields({
				name: `${idx + 1}. ${opt.displayName || key}`,
				value: `${opt.description}\nType: \`${TYPE_NAMES[opt.type as EConfigType] || "Unknown"}\`\nCurrent: ${currentValue}`,
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
			row: new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
				selectMenu,
			),
		};
	}
}
