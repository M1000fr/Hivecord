import { LeBotClient } from "@class/LeBotClient";
import { type IConfigClass } from "@decorators/ConfigContext";
import { ConfigInteraction } from "@decorators/ConfigInteraction";
import type { ConfigPropertyOptions } from "@decorators/ConfigProperty";
import { EConfigType } from "@decorators/ConfigProperty";
import { Button, Modal } from "@decorators/Interaction";
import { Interaction } from "@decorators/params";
import { I18nService } from "@modules/Core/services/I18nService";
import { GeneralConfig } from "@modules/General/GeneralConfig";
import { ConfigHelper } from "@utils/ConfigHelper";

import {
	ActionRowBuilder,
	ButtonBuilder,
	type ButtonInteraction,
	ButtonStyle,
	ModalBuilder,
	type ModalSubmitInteraction,
	type RepliableInteraction,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import { BaseConfigInteractions } from "./BaseConfigInteractions";

@ConfigInteraction()
export class StringConfigInteractions extends BaseConfigInteractions {
	@Modal("module_config_modal:*")
	async handleTextModal(@Interaction() interaction: ModalSubmitInteraction) {
		const ctx = await this.getInteractionContext(interaction);
		if (!ctx) return;
		const { client, parts } = ctx;
		const moduleName = parts[1];
		const propertyKey = parts[2];

		if (moduleName && propertyKey) {
			await this.updateConfig(
				client,
				interaction,
				moduleName,
				propertyKey,
				interaction.fields.getTextInputValue("value"),
				EConfigType.String,
				false,
				true,
			);
		}
	}

	@Button("module_config_edit_text:*")
	async handleEditTextButton(@Interaction() interaction: ButtonInteraction) {
		const ctx = await this.getInteractionContext(interaction);
		if (!ctx) return;
		const { client, parts, userId } = ctx;
		const moduleName = parts[1];
		const propertyKey = parts[2];
		const messageId = parts[3] || "";

		if (!moduleName || !propertyKey) return;

		const { propertyOptions } = this.getPropertyContext(
			client,
			moduleName,
			propertyKey,
		);

		if (!propertyOptions) {
			const payload = { content: "Property not found." };
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp(payload);
			} else {
				await interaction.reply(payload);
			}
			return;
		}

		const rawValue =
			(await this.configHelper.fetchValue(
				interaction.guild!,
				propertyKey,
				EConfigType.String,
			)) || "";

		const { module } = this.getPropertyContext(
			client,
			moduleName,
			propertyKey,
		);
		const defaultValue = this.getDefaultValue(module, propertyKey);

		const valueToUse = (rawValue || defaultValue || "") as string;

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

		if (valueToUse && typeof valueToUse === "string")
			input.setValue(valueToUse);

		const modal = new ModalBuilder({
			customId: ConfigHelper.buildCustomId([
				"module_config_modal",
				moduleName,
				propertyKey,
				messageId,
				userId,
			]),
			title: ConfigHelper.truncate(
				`Configure: ${propertyOptions.displayName || propertyKey}`,
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

	async show(
		interaction: RepliableInteraction,
		propertyOptions: ConfigPropertyOptions,
		selectedProperty: string,
		moduleName: string,
	) {
		const lng = await this.configService.of(
			interaction.guild!,
			GeneralConfig,
		).Language;
		const t = I18nService.getFixedT(lng);
		const module = (interaction.client as LeBotClient).modules.get(
			moduleName.toLowerCase(),
		);
		const defaultValue = this.getDefaultValue(module, selectedProperty);

		const currentValue = await this.configHelper.getCurrentValue(
			interaction.guild!,
			selectedProperty,
			propertyOptions.type,
			t,
			propertyOptions,
			lng,
			defaultValue,
		);

		const configContexts = (
			module?.options.config as unknown as IConfigClass
		)?.configContexts;

		const embed = this.buildPropertyEmbed(
			propertyOptions,
			selectedProperty,
			currentValue,
			{ locale: lng, t },
			configContexts,
		);

		const messageId = interaction.isMessageComponent()
			? interaction.message.id
			: "";

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			this.createConfigButton(
				"module_config_edit_text",
				moduleName,
				selectedProperty,
				interaction.user.id,
				"Edit Value",
				ButtonStyle.Primary,
				[messageId],
			),
		);

		if (!propertyOptions.nonNull) {
			row.addComponents(
				this.createConfigButton(
					"module_config_clear",
					moduleName,
					selectedProperty,
					interaction.user.id,
					"Default Value",
					ButtonStyle.Danger,
				),
			);
		}

		row.addComponents(
			this.createConfigButton(
				"module_config_cancel",
				moduleName,
				selectedProperty,
				interaction.user.id,
				"Cancel",
				ButtonStyle.Secondary,
			),
		);

		await interaction.reply({
			embeds: [embed],
			components: [row],
		});
	}
}
