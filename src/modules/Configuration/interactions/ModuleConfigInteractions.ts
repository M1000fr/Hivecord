import {
	type Interaction,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ActionRowBuilder,
	EmbedBuilder,
	RoleSelectMenuBuilder,
	ChannelSelectMenuBuilder,
	type Message,
	ButtonBuilder,
	ButtonStyle,
	MessageFlags,
	type StringSelectMenuInteraction,
	type RoleSelectMenuInteraction,
	type ChannelSelectMenuInteraction,
	type ModalSubmitInteraction,
	type ButtonInteraction,
} from "discord.js";
import {
	ButtonPattern,
	SelectMenuPattern,
	ModalPattern,
} from "@decorators/Interaction";
import { LeBotClient } from "@class/LeBotClient";
import { InteractionHelper } from "@utils/InteractionHelper";
import { ConfigHelper } from "@utils/ConfigHelper";
import { EConfigType } from "@decorators/ConfigProperty";
import { ConfigService } from "@services/ConfigService";

export class ModuleConfigInteractions {
	private async respondToInteraction(
		interaction: any,
		content: string,
		isError = false,
	) {
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

		return (
			(await interaction.channel?.messages
				.fetch(refId)
				.catch(() => null)) || null
		);
	}

	private async updateConfig(
		client: LeBotClient<true>,
		interaction: any,
		moduleName: string,
		propertyKey: string,
		value: string,
		type: EConfigType,
	) {
		try {
			// Use appropriate ConfigService method based on type
			switch (type) {
				case EConfigType.String:
				case EConfigType.Boolean:
					await ConfigService.set(propertyKey, value);
					break;
				case EConfigType.Role:
					await ConfigService.setRole(propertyKey, value);
					break;
				case EConfigType.Channel:
					await ConfigService.setChannel(propertyKey, value);
					break;
				default:
					await ConfigService.set(propertyKey, value);
			}
			const mainMessage = await this.getMainMessage(interaction);
			if (mainMessage) {
				const config = await ConfigHelper.buildModuleConfigEmbed(
					client,
					moduleName,
					interaction.user.id,
				);
				if (config) {
					await mainMessage.edit({
						embeds: [config.embed],
						components: [config.row],
					});
				}
			}
			await this.respondToInteraction(
				interaction,
				"✅ Configuration updated.",
			);
		} catch (error) {
			console.error("Failed to update config:", error);
			await this.respondToInteraction(
				interaction,
				"❌ Failed to update configuration.",
				true,
			);
		}
	}

	private async validateUser(
		interaction: any,
		userId: string,
	): Promise<boolean> {
		if (interaction.user.id !== userId) {
			await interaction.reply({
				content:
					"❌ You are not allowed to interact with this component.",
				flags: [MessageFlags.Ephemeral],
			});
			return false;
		}
		return true;
	}

	@SelectMenuPattern("module_config:*")
	async handlePropertySelection(interaction: StringSelectMenuInteraction) {
		const client = interaction.client as LeBotClient<true>;
		const parts = ConfigHelper.parseCustomId(interaction.customId);
		const moduleName = parts[1];
		const userId = parts[parts.length - 1];

		if (!userId || !(await this.validateUser(interaction, userId))) return;

		if (moduleName) {
			const module = client.modules.get(moduleName.toLowerCase());
			if (!module?.options.config) {
				await InteractionHelper.respondError(
					interaction,
					"Module not found.",
				);
				return;
			}

			const selectedProperty = interaction.values[0];
			if (!selectedProperty) {
				await InteractionHelper.respondError(
					interaction,
					"No property selected.",
				);
				return;
			}

			const configProperties =
				(module.options.config as any).configProperties || {};
			const propertyOptions = configProperties[selectedProperty];

			if (!propertyOptions) {
				await InteractionHelper.respondError(
					interaction,
					"Property not found.",
				);
				return;
			}

			try {
				const config = await ConfigHelper.buildModuleConfigEmbed(
					client,
					moduleName,
					interaction.user.id,
				);
				if (config && interaction.message) {
					await interaction.message.edit({
						embeds: [config.embed],
						components: [config.row],
					});
				}
			} catch (error) {
				console.error("Failed to reset select menu:", error);
			}

			const isRoleOrChannel = [
				EConfigType.Role,
				EConfigType.Channel,
			].includes(propertyOptions.type);

			if (isRoleOrChannel) {
				await this.handleRoleOrChannelProperty(
					interaction,
					propertyOptions,
					selectedProperty,
					moduleName,
				);
			} else if (propertyOptions.type === EConfigType.Boolean) {
				await this.handleBooleanProperty(
					interaction,
					propertyOptions,
					selectedProperty,
					moduleName,
				);
			} else {
				await this.handleTextProperty(
					interaction,
					propertyOptions,
					selectedProperty,
					moduleName,
				);
			}
		}
	}

	@SelectMenuPattern("module_config_role:*")
	async handleRoleSelection(interaction: RoleSelectMenuInteraction) {
		const client = interaction.client as LeBotClient<true>;
		const parts = ConfigHelper.parseCustomId(interaction.customId);
		const moduleName = parts[1];
		const propertyKey = parts[2];
		const userId = parts[parts.length - 1];

		if (!userId || !(await this.validateUser(interaction, userId))) return;

		if (moduleName && propertyKey && interaction.values[0]) {
			await this.updateConfig(
				client,
				interaction,
				moduleName,
				propertyKey,
				interaction.values[0],
				EConfigType.Role,
			);
		}
	}

	@SelectMenuPattern("module_config_channel:*")
	async handleChannelSelection(interaction: ChannelSelectMenuInteraction) {
		const client = interaction.client as LeBotClient<true>;
		const parts = ConfigHelper.parseCustomId(interaction.customId);
		const moduleName = parts[1];
		const propertyKey = parts[2];
		const userId = parts[parts.length - 1];

		if (!userId || !(await this.validateUser(interaction, userId))) return;

		if (moduleName && propertyKey && interaction.values[0]) {
			await this.updateConfig(
				client,
				interaction,
				moduleName,
				propertyKey,
				interaction.values[0],
				EConfigType.Channel,
			);
		}
	}

	@ModalPattern("module_config_modal:*")
	async handleTextModal(interaction: ModalSubmitInteraction) {
		const client = interaction.client as LeBotClient<true>;
		const parts = ConfigHelper.parseCustomId(interaction.customId);
		const moduleName = parts[1];
		const propertyKey = parts[2];
		const userId = parts[parts.length - 1];

		if (!userId || !(await this.validateUser(interaction, userId))) return;

		if (moduleName && propertyKey) {
			await this.updateConfig(
				client,
				interaction,
				moduleName,
				propertyKey,
				interaction.fields.getTextInputValue("value"),
				EConfigType.String,
			);
		}
	}

	@ButtonPattern("module_config_bool:*")
	async handleBooleanButton(interaction: ButtonInteraction) {
		const client = interaction.client as LeBotClient<true>;
		const parts = ConfigHelper.parseCustomId(interaction.customId);
		const moduleName = parts[1];
		const propertyKey = parts[2];
		const value = parts[3];
		const userId = parts[parts.length - 1];

		if (!userId || !(await this.validateUser(interaction, userId))) return;

		if (moduleName && propertyKey && value) {
			await this.updateConfig(
				client,
				interaction,
				moduleName,
				propertyKey,
				value,
				EConfigType.Boolean,
			);
		}
	}

	private buildSelectComponent(
		type: EConfigType,
		moduleName: string,
		selectedProperty: string,
		userId: string,
	) {
		const customId = ConfigHelper.buildCustomId([
			type === EConfigType.Role
				? "module_config_role"
				: "module_config_channel",
			moduleName,
			selectedProperty,
			userId,
		]);
		const placeholder =
			type === EConfigType.Role ? "Select a role" : "Select a channel";

		const component =
			type === EConfigType.Role
				? new RoleSelectMenuBuilder()
				: new ChannelSelectMenuBuilder();

		return component
			.setCustomId(customId)
			.setPlaceholder(placeholder)
			.setMinValues(1)
			.setMaxValues(1);
	}

	private async handleRoleOrChannelProperty(
		interaction: any,
		propertyOptions: any,
		selectedProperty: string,
		moduleName: string,
	) {
		const currentValue = await ConfigHelper.getCurrentValue(
			selectedProperty,
			propertyOptions.type,
			propertyOptions.defaultValue,
		);
		const embed = this.buildPropertyEmbed(
			propertyOptions,
			selectedProperty,
			currentValue,
		);
		const component = this.buildSelectComponent(
			propertyOptions.type,
			moduleName,
			selectedProperty,
			interaction.user.id,
		);

		await interaction.reply({
			embeds: [embed],
			components: [new ActionRowBuilder<any>().addComponents(component)],
			flags: [MessageFlags.Ephemeral],
		});
	}

	private async handleTextProperty(
		interaction: any,
		propertyOptions: any,
		selectedProperty: string,
		moduleName: string,
	) {
		const rawValue =
			(await ConfigHelper.fetchValue(
				selectedProperty,
				EConfigType.String,
				propertyOptions.defaultValue,
			)) || "";
		const labelText = ConfigHelper.truncate(
			propertyOptions.description,
			45,
		);

		const input = new TextInputBuilder({
			customId: "value",
			label: labelText,
			style: TextInputStyle.Paragraph,
			required: propertyOptions.required ?? false,
			placeholder: "Enter text value",
		});

		if (rawValue) input.setValue(rawValue);

		const modal = new ModalBuilder({
			customId: ConfigHelper.buildCustomId([
				"module_config_modal",
				moduleName,
				selectedProperty,
				interaction.user.id,
			]),
			title: ConfigHelper.truncate(
				`Configure: ${propertyOptions.displayName || selectedProperty}`,
				45,
			),
			components: [
				new ActionRowBuilder<TextInputBuilder>()
					.addComponents(input)
					.toJSON(),
			],
		});

		await interaction.showModal(modal);
	}

	private async handleBooleanProperty(
		interaction: any,
		propertyOptions: any,
		selectedProperty: string,
		moduleName: string,
	) {
		const currentValue = await ConfigHelper.getCurrentValue(
			selectedProperty,
			propertyOptions.type,
			propertyOptions.defaultValue,
		);
		const embed = this.buildPropertyEmbed(
			propertyOptions,
			selectedProperty,
			currentValue,
		);

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId(
					ConfigHelper.buildCustomId([
						"module_config_bool",
						moduleName,
						selectedProperty,
						"true",
						interaction.user.id,
					]),
				)
				.setLabel("Enable")
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId(
					ConfigHelper.buildCustomId([
						"module_config_bool",
						moduleName,
						selectedProperty,
						"false",
						interaction.user.id,
					]),
				)
				.setLabel("Disable")
				.setStyle(ButtonStyle.Danger),
		);

		await interaction.reply({
			embeds: [embed],
			components: [row],
			flags: [MessageFlags.Ephemeral],
		});
	}

	private buildPropertyEmbed(
		propertyOptions: any,
		selectedProperty: string,
		currentValue: string,
	) {
		return new EmbedBuilder()
			.setTitle(
				`⚙️ Configure: ${propertyOptions.displayName || selectedProperty}`,
			)
			.setDescription(
				`${propertyOptions.description}\n\n**Current value:** ${currentValue}`,
			)
			.setColor("#5865F2")
			.setTimestamp();
	}
}
