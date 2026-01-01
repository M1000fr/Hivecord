import { ConfigInteraction } from "@decorators/ConfigInteraction";
import type { ConfigPropertyOptions } from "@decorators/ConfigProperty";
import { Button, Modal } from "@decorators/Interaction";
import { Interaction } from "@decorators/params";
import { ConfigHelper } from "@utils/ConfigHelper";
import { CustomIdHelper } from "@utils/CustomIdHelper";

import { BaseConfigInteractions } from "@class/BaseConfigInteractions";
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

@ConfigInteraction()
export class StringConfigInteractions extends BaseConfigInteractions {
	@Modal("module_config_modal:*")
	async handleTextModal(@Interaction() interaction: ModalSubmitInteraction) {
		const ctx = await this.getHandleContext(interaction);
		if (!ctx) return;
		const { client, moduleName, propertyKey, propertyOptions } = ctx;

		await this.updateConfig(
			client,
			interaction,
			moduleName,
			propertyKey,
			interaction.fields.getTextInputValue("value"),
			propertyOptions.type,
			false,
			true,
		);
	}

	@Button("module_config_edit_text:*")
	async handleEditTextButton(@Interaction() interaction: ButtonInteraction) {
		const ctx = await this.getHandleContext(interaction);
		if (!ctx) return;
		const {
			client,
			moduleName,
			propertyKey,
			parts,
			module,
			propertyOptions,
		} = ctx;
		const messageId = parts[3] || "";

		const { t } = await this.getLanguageContext(interaction);
		const defaultValue = this.getDefaultValue(module, propertyKey);

		const rawValue = await this.configHelper.fetchValue(
			interaction.guild!,
			propertyKey,
			propertyOptions.type,
		);

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
			customId: CustomIdHelper.build([
				"module_config_modal",
				moduleName,
				propertyKey,
				messageId,
				interaction.user.id,
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
		const { t, embed, messageId } = await this.getShowContext(
			interaction,
			moduleName,
			selectedProperty,
			propertyOptions,
		);

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			this.createConfigButton(
				"module_config_edit_text",
				moduleName,
				selectedProperty,
				interaction.user.id,
				t("common.edit"),
				ButtonStyle.Primary,
				[messageId],
			),
		);

		if (!propertyOptions.nonNull) {
			row.addComponents(
				this.createClearButton(
					moduleName,
					selectedProperty,
					interaction.user.id,
					t,
					messageId,
				),
			);
		}

		row.addComponents(
			this.createCancelButton(
				moduleName,
				selectedProperty,
				interaction.user.id,
				t,
			),
		);

		await interaction.reply({
			embeds: [embed],
			components: [row],
		});
	}
}
