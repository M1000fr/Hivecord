import { BaseConfigInteractions } from "@class/BaseConfigInteractions";
import { HivecordClient } from "@class/HivecordClient";
import { ConfigInteraction } from "@decorators/ConfigInteraction";
import type { ConfigPropertyOptions } from "@decorators/ConfigProperty";
import { Button } from "@decorators/Interaction";
import { Interaction } from "@decorators/params";
import { ButtonInteraction, type RepliableInteraction } from "discord.js";

@ConfigInteraction()
export class BooleanConfigInteractions extends BaseConfigInteractions {
	@Button("module_config_bool:*")
	async handleBooleanButton(@Interaction() interaction: ButtonInteraction) {
		const ctx = await this.getHandleContext(interaction);
		if (!ctx) return;
		const { client, moduleName, propertyKey, propertyOptions, parts } = ctx;
		const value = parts[3];

		if (value) {
			await this.updateConfig(
				client,
				interaction,
				moduleName,
				propertyKey,
				value,
				propertyOptions.type,
			);
		}
	}

	async show(
		interaction: RepliableInteraction,
		propertyOptions: ConfigPropertyOptions,
		selectedProperty: string,
		moduleName: string,
	) {
		const { currentValue, defaultValue } = await this.getShowContext(
			interaction,
			moduleName,
			selectedProperty,
			propertyOptions,
		);

		const valueToCheck = currentValue ?? defaultValue;
		const isTrue = String(valueToCheck) === "true";
		const newValue = !isTrue;

		await this.updateConfig(
			interaction.client as HivecordClient<true>,
			interaction,
			moduleName,
			selectedProperty,
			String(newValue),
			propertyOptions.type,
		);
	}
}
