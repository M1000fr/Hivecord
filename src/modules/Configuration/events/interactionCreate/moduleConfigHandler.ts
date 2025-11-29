import {
	Events,
	type Interaction,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ActionRowBuilder,
	ApplicationCommandOptionType,
	EmbedBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	MessageFlags,
	RoleSelectMenuBuilder,
	ChannelSelectMenuBuilder,
	type Message,
	ButtonBuilder,
	ButtonStyle,
} from "discord.js";
import { BaseEvent } from '@class/BaseEvent';
import { Event } from '@decorators/Event';
import { LeBotClient } from '@class/LeBotClient';
import { ConfigService } from '@services/ConfigService';
import { InteractionHelper } from '@utils/InteractionHelper';

const TYPE_NAMES: Record<ApplicationCommandOptionType, string> = {
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

class ConfigHelper {
	static toSnakeCase(str: string): string {
		return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
	}

	static truncate(str: string, maxLength: number): string {
		return str.length > maxLength ? `${str.substring(0, maxLength - 3)}...` : str;
	}

	static formatValue(value: string, type: ApplicationCommandOptionType): string {
		if (type === ApplicationCommandOptionType.Role) return `<@&${value}>`;
		if (type === ApplicationCommandOptionType.Channel) return `<#${value}>`;
		return this.truncate(value, 100);
	}

	static async fetchValue(key: string, type: ApplicationCommandOptionType): Promise<string | null> {
		const snakeKey = this.toSnakeCase(key);
		if (type === ApplicationCommandOptionType.Role) return ConfigService.getRole(snakeKey);
		if (type === ApplicationCommandOptionType.Channel) return ConfigService.getChannel(snakeKey);
		return ConfigService.get(snakeKey);
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
}

@Event({
	name: Events.InteractionCreate,
})
export default class ModuleConfigInteractionHandler extends BaseEvent<Events.InteractionCreate> {
	private async getCurrentValue(key: string, type: ApplicationCommandOptionType): Promise<string> {
		try {
			const value = await ConfigHelper.fetchValue(key, type);
			return value ? ConfigHelper.formatValue(value, type) : "*Not set*";
		} catch {
			return "*Not set*";
		}
	}

	private async buildModuleConfigEmbed(client: LeBotClient<true>, moduleName: string) {
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
			const currentValue = await this.getCurrentValue(key, opt.type);

			embed.addFields({
				name: `${idx + 1}. ${opt.displayName || key}`,
				value: `${opt.description}\nType: \`${TYPE_NAMES[opt.type as ApplicationCommandOptionType] || "Unknown"}\`\nCurrent: ${currentValue}`,
				inline: false,
			});
		}

		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId(ConfigHelper.buildCustomId(["module_config", moduleName.toLowerCase()]))
			.setPlaceholder("Select a property to configure")
			.addOptions(
				Object.entries(configProperties).map(([key, options], idx) => {
					const opt = options as any;
					return new StringSelectMenuOptionBuilder()
						.setLabel(`${idx + 1}. ${opt.displayName || key}`)
						.setDescription(ConfigHelper.truncate(opt.description, 100))
						.setValue(key);
				}),
			);

		return { 
			embed, 
			row: new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu) 
		};
	}

	private async respondToInteraction(interaction: any, content: string, isError = false) {
		if (isError) {
			await InteractionHelper.respondError(interaction, content);
		} else {
			await InteractionHelper.respond(interaction, content);
		}
	}

	private async getMainMessage(interaction: any): Promise<Message | null> {
		if (interaction.isModalSubmit()) return interaction.message;
		
		const refId = interaction.message.reference?.messageId;
		if (!refId) return null;

		return await interaction.channel?.messages.fetch(refId).catch(() => null) || null;
	}

	private async updateConfig(
		client: LeBotClient<true>,
		interaction: any,
		moduleName: string,
		propertyKey: string,
		value: string,
		type: ApplicationCommandOptionType,
	) {
		try {
			await ConfigHelper.saveValue(propertyKey, value, type);
			const displayValue = ConfigHelper.formatValue(value, type);

			await InteractionHelper.respondSuccess(
				interaction, 
				`Successfully updated **${propertyKey}** to ${displayValue}`
			);

			const mainMessage = await this.getMainMessage(interaction);
			if (mainMessage) {
				const config = await this.buildModuleConfigEmbed(client, moduleName);
				if (config) {
					await mainMessage.edit({ embeds: [config.embed], components: [config.row] });
				}
			}
		} catch (error) {
			console.error(error);
			await InteractionHelper.respondError(interaction, "An error occurred while saving the configuration.");
		}
	}

	async run(client: LeBotClient<true>, interaction: Interaction) {
		if (!("customId" in interaction)) return;
		
		const [action, moduleName, propertyKey] = ConfigHelper.parseCustomId(interaction.customId);

		if (interaction.isStringSelectMenu() && action === "module_config" && moduleName) {
			await this.handlePropertySelection(client, interaction, moduleName);
		} else if (interaction.isRoleSelectMenu() && action === "module_config_role" && moduleName && propertyKey && interaction.values[0]) {
			await this.updateConfig(client, interaction, moduleName, propertyKey, interaction.values[0], ApplicationCommandOptionType.Role);
		} else if (interaction.isChannelSelectMenu() && action === "module_config_channel" && moduleName && propertyKey && interaction.values[0]) {
			await this.updateConfig(client, interaction, moduleName, propertyKey, interaction.values[0], ApplicationCommandOptionType.Channel);
		} else if (interaction.isModalSubmit() && action === "module_config_modal" && moduleName && propertyKey) {
			await this.updateConfig(client, interaction, moduleName, propertyKey, interaction.fields.getTextInputValue("value"), ApplicationCommandOptionType.String);
		} else if (interaction.isButton() && action === "module_config_bool" && moduleName && propertyKey) {
			const value = ConfigHelper.parseCustomId(interaction.customId)[3];
			if (!value) return;
			await this.updateConfig(client, interaction, moduleName, propertyKey, value, ApplicationCommandOptionType.Boolean);
		}
	}

	private buildPropertyEmbed(propertyOptions: any, selectedProperty: string, currentValue: string) {
		return new EmbedBuilder()
			.setTitle(`⚙️ Configure: ${propertyOptions.displayName || selectedProperty}`)
			.setDescription(`${propertyOptions.description}\n\n**Current value:** ${currentValue}`)
			.setColor("#5865F2")
			.setTimestamp();
	}

	private buildSelectComponent(type: ApplicationCommandOptionType, moduleName: string, selectedProperty: string) {
		const customId = ConfigHelper.buildCustomId([
			type === ApplicationCommandOptionType.Role ? "module_config_role" : "module_config_channel",
			moduleName,
			selectedProperty
		]);
		const placeholder = type === ApplicationCommandOptionType.Role ? "Select a role" : "Select a channel";

		const component = type === ApplicationCommandOptionType.Role
			? new RoleSelectMenuBuilder()
			: new ChannelSelectMenuBuilder();

		return component.setCustomId(customId).setPlaceholder(placeholder).setMinValues(1).setMaxValues(1);
	}

	private async handleRoleOrChannelProperty(interaction: any, propertyOptions: any, selectedProperty: string, moduleName: string) {
		const currentValue = await this.getCurrentValue(selectedProperty, propertyOptions.type);
		const embed = this.buildPropertyEmbed(propertyOptions, selectedProperty, currentValue);
		const component = this.buildSelectComponent(propertyOptions.type, moduleName, selectedProperty);

		await interaction.reply({
			embeds: [embed],
			components: [new ActionRowBuilder<any>().addComponents(component)],
			flags: [MessageFlags.Ephemeral],
		});
	}

	private async handleTextProperty(interaction: any, propertyOptions: any, selectedProperty: string, moduleName: string) {
		const rawValue = await ConfigHelper.fetchValue(selectedProperty, ApplicationCommandOptionType.String) || "";
		const labelText = ConfigHelper.truncate(propertyOptions.description, 45);

		const input = new TextInputBuilder({
			customId: "value",
			label: labelText,
			style: TextInputStyle.Paragraph,
			required: propertyOptions.required ?? false,
			placeholder: "Enter text value",
		});

		if (rawValue) input.setValue(rawValue);

		const modal = new ModalBuilder({
			customId: ConfigHelper.buildCustomId(["module_config_modal", moduleName, selectedProperty]),
			title: ConfigHelper.truncate(`Configure: ${propertyOptions.displayName || selectedProperty}`, 45),
			components: [new ActionRowBuilder<TextInputBuilder>().addComponents(input).toJSON()],
		});

		await interaction.showModal(modal);
	}

	private async handleBooleanProperty(interaction: any, propertyOptions: any, selectedProperty: string, moduleName: string) {
		const currentValue = await this.getCurrentValue(selectedProperty, propertyOptions.type);
		const embed = this.buildPropertyEmbed(propertyOptions, selectedProperty, currentValue);

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId(ConfigHelper.buildCustomId(["module_config_bool", moduleName, selectedProperty, "true"]))
				.setLabel("Enable")
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId(ConfigHelper.buildCustomId(["module_config_bool", moduleName, selectedProperty, "false"]))
				.setLabel("Disable")
				.setStyle(ButtonStyle.Danger),
		);

		await interaction.reply({
			embeds: [embed],
			components: [row],
			flags: [MessageFlags.Ephemeral],
		});
	}

	private async handlePropertySelection(client: LeBotClient<true>, interaction: any, moduleName: string) {
		const module = client.modules.get(moduleName.toLowerCase());
		if (!module?.options.config) {
			await InteractionHelper.respondError(interaction, "Module not found.");
			return;
		}

		const selectedProperty = interaction.values[0];
		const configProperties = (module.options.config as any).configProperties || {};
		const propertyOptions = configProperties[selectedProperty];

		if (!propertyOptions) {
			await InteractionHelper.respondError(interaction, "Property not found.");
			return;
		}

		try {
			const config = await this.buildModuleConfigEmbed(client, moduleName);
			if (config && interaction.message) {
				await interaction.message.edit({ embeds: [config.embed], components: [config.row] });
			}
		} catch (error) {
			console.error("Failed to reset select menu:", error);
		}

		const isRoleOrChannel = [ApplicationCommandOptionType.Role, ApplicationCommandOptionType.Channel].includes(propertyOptions.type);
		
		if (isRoleOrChannel) {
			await this.handleRoleOrChannelProperty(interaction, propertyOptions, selectedProperty, moduleName);
		} else if (propertyOptions.type === ApplicationCommandOptionType.Boolean) {
			await this.handleBooleanProperty(interaction, propertyOptions, selectedProperty, moduleName);
		} else {
			await this.handleTextProperty(interaction, propertyOptions, selectedProperty, moduleName);
		}
	}
}
