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
} from "discord.js";
import { BaseEvent } from "../../../../class/BaseEvent";
import { Event } from "../../../../decorators/Event";
import { LeBotClient } from "../../../../class/LeBotClient";
import { ConfigService } from "../../../../services/ConfigService";

@Event({
	name: Events.InteractionCreate,
})
export default class ModuleConfigInteractionHandler extends BaseEvent<Events.InteractionCreate> {
	private async getCurrentValue(
		key: string,
		type: ApplicationCommandOptionType,
	): Promise<string> {
		try {
			const snakeCaseKey = key.replace(
				/[A-Z]/g,
				(letter: string) => `_${letter.toLowerCase()}`,
			);

			if (type === ApplicationCommandOptionType.Role) {
				const roleId = await ConfigService.getRole(snakeCaseKey);
				if (roleId) return `<@&${roleId}>`;
			} else if (type === ApplicationCommandOptionType.Channel) {
				const channelId = await ConfigService.getChannel(snakeCaseKey);
				if (channelId) return `<#${channelId}>`;
			} else {
				const value = await ConfigService.get(snakeCaseKey);
				if (value)
					return value.length > 100
						? value.substring(0, 97) + "..."
						: value;
			}
		} catch (error) {
			// Ignore errors
		}
		return "*Not set*";
	}

	private async buildModuleConfigEmbed(
		client: LeBotClient<true>,
		moduleName: string,
	) {
		const module = client.modules.get(moduleName.toLowerCase());
		if (!module || !module.options.config) return null;

		const configClass = module.options.config;
		const configProperties = (configClass as any).configProperties || {};

		const embed = new EmbedBuilder()
			.setTitle(`⚙️ Configuration: ${module.options.name}`)
			.setDescription(
				`Select a property to configure for the **${module.options.name}** module.`,
			)
			.setColor("#5865F2")
			.setTimestamp();

		let index = 1;
		for (const [key, options] of Object.entries(configProperties)) {
			const opt = options as any;
			const typeNames: { [key: number]: string } = {
				[ApplicationCommandOptionType.String]: "Text",
				[ApplicationCommandOptionType.Role]: "Role",
				[ApplicationCommandOptionType.Channel]: "Channel",
				[ApplicationCommandOptionType.User]: "User",
				[ApplicationCommandOptionType.Integer]: "Number",
				[ApplicationCommandOptionType.Boolean]: "Boolean",
			};

			const currentValue = await this.getCurrentValue(key, opt.type);

			embed.addFields({
				name: `${index}. ${opt.displayName || key}`,
				value: `${opt.description}\nType: \`${typeNames[opt.type] || "Unknown"}\`\nCurrent: ${currentValue}`,
				inline: false,
			});
			index++;
		}

		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId(`module_config:${moduleName.toLowerCase()}`)
			.setPlaceholder("Select a property to configure")
			.addOptions(
				Object.entries(configProperties).map(([key, options], idx) => {
					const opt = options as any;
					return new StringSelectMenuOptionBuilder()
						.setLabel(`${idx + 1}. ${opt.displayName || key}`)
						.setDescription(opt.description.substring(0, 100))
						.setValue(key);
				}),
			);

		const row =
			new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
				selectMenu,
			);
		return { embed, row };
	}

	private async updateConfig(
		client: LeBotClient<true>,
		interaction: any,
		moduleName: string,
		propertyKey: string,
		value: string,
		type: ApplicationCommandOptionType,
	) {
		const snakeCaseKey = propertyKey.replace(
			/[A-Z]/g,
			(letter: string) => `_${letter.toLowerCase()}`,
		);
		let saved = false;
		let displayValue = value;

		try {
			if (type === ApplicationCommandOptionType.Role) {
				await ConfigService.setRole(snakeCaseKey, value);
				saved = true;
				displayValue = `<@&${value}>`;
			} else if (type === ApplicationCommandOptionType.Channel) {
				await ConfigService.setChannel(snakeCaseKey, value);
				saved = true;
				displayValue = `<#${value}>`;
			} else {
				await ConfigService.set(snakeCaseKey, value);
				saved = true;
			}

			if (saved) {
				// Reply/Update interaction
				const replyContent = `✅ Successfully updated **${propertyKey}** to ${displayValue}`;
				if (interaction.isModalSubmit()) {
					await interaction.reply({
						content: replyContent,
						flags: [MessageFlags.Ephemeral],
					});
				} else {
					await interaction.update({
						content: replyContent,
						embeds: [],
						components: [],
					});
				}

				// Update main message
				let mainMessage: Message | null = null;

				if (interaction.isModalSubmit()) {
					// For modal submit, the message is directly available
					mainMessage = interaction.message;
				} else {
					// For select menus (ephemeral), try to find the main message
					// This is best effort as we don't have a direct link
					if (interaction.message.reference?.messageId) {
						mainMessage =
							(await interaction.channel?.messages
								.fetch(interaction.message.reference.messageId)
								.catch(() => null)) || null;
					}
				}

				if (mainMessage) {
					const config = await this.buildModuleConfigEmbed(
						client,
						moduleName,
					);
					if (config) {
						await mainMessage.edit({
							embeds: [config.embed],
							components: [config.row],
						});
					}
				}
			}
		} catch (error) {
			console.error(error);
			const errorContent =
				"An error occurred while saving the configuration.";
			if (interaction.isModalSubmit()) {
				await interaction.reply({
					content: errorContent,
					flags: [MessageFlags.Ephemeral],
				});
			} else {
				await interaction.update({
					content: errorContent,
					embeds: [],
					components: [],
				});
			}
		}
	}

	async run(client: LeBotClient<true>, interaction: Interaction) {
		if (interaction.isStringSelectMenu()) {
			const [action, moduleName] = interaction.customId.split(":");
			if (action === "module_config" && moduleName) {
				await this.handlePropertySelection(
					client,
					interaction,
					moduleName,
				);
			}
		} else if (interaction.isRoleSelectMenu()) {
			const [action, moduleName, propertyKey] =
				interaction.customId.split(":");
			if (
				action === "module_config_role" &&
				moduleName &&
				propertyKey &&
				interaction.values[0]
			) {
				await this.updateConfig(
					client,
					interaction,
					moduleName,
					propertyKey,
					interaction.values[0],
					ApplicationCommandOptionType.Role,
				);
			}
		} else if (interaction.isChannelSelectMenu()) {
			const [action, moduleName, propertyKey] =
				interaction.customId.split(":");
			if (
				action === "module_config_channel" &&
				moduleName &&
				propertyKey &&
				interaction.values[0]
			) {
				await this.updateConfig(
					client,
					interaction,
					moduleName,
					propertyKey,
					interaction.values[0],
					ApplicationCommandOptionType.Channel,
				);
			}
		} else if (interaction.isModalSubmit()) {
			const [action, moduleName, propertyKey] =
				interaction.customId.split(":");
			if (action === "module_config_modal" && moduleName && propertyKey) {
				await this.updateConfig(
					client,
					interaction,
					moduleName,
					propertyKey,
					interaction.fields.getTextInputValue("value"),
					ApplicationCommandOptionType.String,
				);
			}
		}
	}

	private async handlePropertySelection(
		client: LeBotClient<true>,
		interaction: any,
		moduleName: string,
	) {
		const module = client.modules.get(moduleName.toLowerCase());
		if (!module || !module.options.config) {
			await interaction.reply({
				content: "Module not found.",
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		const selectedProperty = interaction.values[0];

		// Reset the select menu to allow re-selection of the same property
		try {
			const config = await this.buildModuleConfigEmbed(client, moduleName);
			if (config && interaction.message) {
				await interaction.message.edit({
					embeds: [config.embed],
					components: [config.row],
				});
			}
		} catch (error) {
			console.error("Failed to reset select menu:", error);
		}

		const configProperties =
			(module.options.config as any).configProperties || {};
		const propertyOptions = configProperties[selectedProperty];

		if (!propertyOptions) {
			await interaction.reply({
				content: "Property not found.",
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		if (
			propertyOptions.type === ApplicationCommandOptionType.Role ||
			propertyOptions.type === ApplicationCommandOptionType.Channel
		) {
			const currentValue = await this.getCurrentValue(
				selectedProperty,
				propertyOptions.type,
			);

			const embed = new EmbedBuilder()
				.setTitle(`⚙️ Configure: ${propertyOptions.displayName || selectedProperty}`)
				.setDescription(
					`${propertyOptions.description}\n\n**Current value:** ${currentValue}`,
				)
				.setColor("#5865F2")
				.setTimestamp();

			let component;
			if (propertyOptions.type === ApplicationCommandOptionType.Role) {
				component = new RoleSelectMenuBuilder()
					.setCustomId(
						`module_config_role:${moduleName}:${selectedProperty}`,
					)
					.setPlaceholder("Select a role")
					.setMinValues(1)
					.setMaxValues(1);
			} else {
				component = new ChannelSelectMenuBuilder()
					.setCustomId(
						`module_config_channel:${moduleName}:${selectedProperty}`,
					)
					.setPlaceholder("Select a channel")
					.setMinValues(1)
					.setMaxValues(1);
			}

			const row = new ActionRowBuilder<any>().addComponents(component);
			await interaction.reply({
				embeds: [embed],
				components: [row],
				flags: [MessageFlags.Ephemeral],
			});
		} else {
			const snakeCaseKey = selectedProperty.replace(
				/[A-Z]/g,
				(letter: string) => `_${letter.toLowerCase()}`,
			);
			let rawValue = "";
			const val = await ConfigService.get(snakeCaseKey);
			if (val) rawValue = val;

			const labelText =
				propertyOptions.description.length > 45
					? propertyOptions.description.substring(0, 42) + "..."
					: propertyOptions.description;

			const input = new TextInputBuilder({
				customId: "value",
				label: labelText,
				style: TextInputStyle.Paragraph,
				required: propertyOptions.required ?? false,
				placeholder: "Enter text value",
			});

			if (rawValue) {
				input.setValue(rawValue);
			}

			const row = new ActionRowBuilder<TextInputBuilder>().addComponents(
				input,
			);

			const modal = new ModalBuilder({
				customId: `module_config_modal:${moduleName}:${selectedProperty}`,
				title: `Configure: ${propertyOptions.displayName || selectedProperty}`,
				components: [row.toJSON()],
			});

			await interaction.showModal(modal);
		}
	}
}
