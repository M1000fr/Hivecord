import { EConfigType } from "@decorators/ConfigProperty";
import { ButtonPattern } from "@decorators/Interaction";
import { ConfigHelper } from "@utils/ConfigHelper";
import {
	ActionRowBuilder,
	ButtonBuilder,
	type ButtonInteraction,
	ButtonStyle,
	MessageFlags,
} from "discord.js";
import { BaseConfigInteractions } from "./BaseConfigInteractions";

export class BooleanConfigInteractions extends BaseConfigInteractions {
	@ButtonPattern("module_config_bool:*")
	async handleBooleanButton(interaction: ButtonInteraction) {
		const ctx = await this.getInteractionContext(interaction);
		if (!ctx) return;
		const { client, parts } = ctx;
		const moduleName = parts[1];
		const propertyKey = parts[2];
		const value = parts[3];

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

	async show(
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
			this.createConfigButton(
				"module_config_bool",
				moduleName,
				selectedProperty,
				interaction.user.id,
				"Enable",
				ButtonStyle.Success,
				["true"],
			),
			this.createConfigButton(
				"module_config_bool",
				moduleName,
				selectedProperty,
				interaction.user.id,
				"Disable",
				ButtonStyle.Danger,
				["false"],
			),
			this.createConfigButton(
				"module_config_clear",
				moduleName,
				selectedProperty,
				interaction.user.id,
				"Clear",
				ButtonStyle.Secondary,
			),
		);

		await interaction.reply({
			embeds: [embed],
			components: [row],
			flags: [MessageFlags.Ephemeral],
		});
	}
}
