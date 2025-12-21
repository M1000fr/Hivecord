import { LeBotClient } from "@class/LeBotClient";
import { ConfigInteraction } from "@decorators/ConfigInteraction";
import type { ConfigPropertyOptions } from "@decorators/ConfigProperty";
import { EConfigType } from "@decorators/ConfigProperty";
import { ButtonPattern } from "@decorators/Interaction";
import { type ButtonInteraction, type RepliableInteraction } from "discord.js";
import { BaseConfigInteractions } from "./BaseConfigInteractions";

@ConfigInteraction()
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
		interaction: RepliableInteraction,
		propertyOptions: ConfigPropertyOptions,
		selectedProperty: string,
		moduleName: string,
	) {
		if (!interaction.guildId) {
			const payload = {
				content: "This interaction can only be used in a server.",
			};
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp(payload);
			} else {
				await interaction.reply(payload);
			}
			return;
		}

		const currentValue = await this.configHelper.fetchValue(
			interaction.guildId,
			selectedProperty,
			EConfigType.Boolean,
			propertyOptions.defaultValue,
		);

		const isTrue = String(currentValue) === "true";
		const newValue = !isTrue;

		await this.updateConfig(
			interaction.client as LeBotClient<true>,
			interaction,
			moduleName,
			selectedProperty,
			String(newValue),
			EConfigType.Boolean,
		);
	}
}
