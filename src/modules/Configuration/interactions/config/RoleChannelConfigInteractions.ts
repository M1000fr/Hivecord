import { EConfigType } from "@decorators/ConfigProperty";
import { SelectMenuPattern } from "@decorators/Interaction";
import { ConfigHelper } from "@utils/ConfigHelper";
import {
	ActionRowBuilder,
	ButtonStyle,
	ChannelSelectMenuBuilder,
	type ChannelSelectMenuInteraction,
	MessageFlags,
	RoleSelectMenuBuilder,
	type RoleSelectMenuInteraction,
} from "discord.js";
import { BaseConfigInteractions } from "./BaseConfigInteractions";

export class RoleChannelConfigInteractions extends BaseConfigInteractions {
	@SelectMenuPattern("module_config_role:*")
	async handleRoleSelection(interaction: RoleSelectMenuInteraction) {
		const ctx = await this.getInteractionContext(interaction);
		if (!ctx) return;
		const { client, parts } = ctx;
		const moduleName = parts[1];
		const propertyKey = parts[2];

		if (!moduleName || !propertyKey) return;

		const { propertyOptions } = this.getPropertyContext(
			client,
			moduleName,
			propertyKey,
		);
		const isArray = propertyOptions?.type === EConfigType.RoleArray;

		if (interaction.values.length > 0 || isArray) {
			await this.updateConfig(
				client,
				interaction,
				moduleName,
				propertyKey,
				isArray ? interaction.values : interaction.values[0] || "",
				isArray ? EConfigType.RoleArray : EConfigType.Role,
			);
		}
	}

	@SelectMenuPattern("module_config_channel:*")
	async handleChannelSelection(interaction: ChannelSelectMenuInteraction) {
		const ctx = await this.getInteractionContext(interaction);
		if (!ctx) return;
		const { client, parts } = ctx;
		const moduleName = parts[1];
		const propertyKey = parts[2];

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

	private buildSelectComponent(
		type: EConfigType,
		moduleName: string,
		selectedProperty: string,
		userId: string,
		defaultValue?: string | string[] | null,
	) {
		const isRole =
			type === EConfigType.Role || type === EConfigType.RoleArray;
		const customId = ConfigHelper.buildCustomId([
			isRole ? "module_config_role" : "module_config_channel",
			moduleName,
			selectedProperty,
			userId,
		]);
		const placeholder = isRole ? "Select role(s)" : "Select a channel";

		const component = isRole
			? new RoleSelectMenuBuilder()
			: new ChannelSelectMenuBuilder();

		component.setCustomId(customId).setPlaceholder(placeholder);

		if (type === EConfigType.RoleArray) {
			component.setMinValues(0).setMaxValues(25);
		} else {
			component.setMinValues(1).setMaxValues(1);
		}

		if (defaultValue) {
			const values = Array.isArray(defaultValue)
				? defaultValue
				: [defaultValue];
			const validValues = values.filter((v) => v);

			if (validValues.length > 0) {
				if (isRole) {
					(component as RoleSelectMenuBuilder).setDefaultRoles(
						validValues,
					);
				} else {
					(component as ChannelSelectMenuBuilder).setDefaultChannels(
						validValues,
					);
				}
			}
		}

		return component;
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

		const rawValue = await ConfigHelper.fetchValue(
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
			rawValue,
		);

		const components: any[] = [
			new ActionRowBuilder<any>().addComponents(component),
		];

		if (
			propertyOptions.type === EConfigType.Role ||
			propertyOptions.type === EConfigType.Channel
		) {
			const clearButton = this.createConfigButton(
				"module_config_clear",
				moduleName,
				selectedProperty,
				interaction.user.id,
				"Clear Selection",
				ButtonStyle.Danger,
			);

			components.push(
				new ActionRowBuilder<any>().addComponents(clearButton),
			);
		}

		await interaction.reply({
			embeds: [embed],
			components: components,
			flags: [MessageFlags.Ephemeral],
		});
	}
}
