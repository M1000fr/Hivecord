import { LeBotClient } from "@class/LeBotClient";
import { EConfigType } from "@decorators/ConfigProperty";
import { ButtonPattern } from "@decorators/Interaction";
import { ConfigHelper } from "@utils/ConfigHelper";
import { type ButtonInteraction } from "discord.js";
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
		const currentValue = await ConfigHelper.fetchValue(
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
