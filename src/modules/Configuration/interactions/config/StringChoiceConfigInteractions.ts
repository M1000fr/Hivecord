import { BaseConfigInteractions } from "@class/BaseConfigInteractions";
import { LeBotClient } from "@class/LeBotClient";
import { ConfigInteraction } from "@decorators/ConfigInteraction";
import type { ConfigPropertyOptions } from "@decorators/ConfigProperty";
import { EConfigType } from "@decorators/ConfigProperty";
import { SelectMenu } from "@decorators/Interaction";
import { Interaction } from "@decorators/params";
import { I18nService } from "@modules/Core/services/I18nService";
import { ConfigHelper } from "@utils/ConfigHelper";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	type Locale,
	type RepliableInteraction,
	type StringSelectMenuInteraction,
} from "discord.js";

@ConfigInteraction()
export class StringChoiceConfigInteractions extends BaseConfigInteractions {
	@SelectMenu("module_config_choice:*")
	async handleChoiceSelection(
		@Interaction() interaction: StringSelectMenuInteraction,
	) {
		const ctx = await this.getInteractionContext(interaction);
		if (!ctx) return;
		const { client, parts } = ctx;
		const moduleName = parts[1];
		const propertyKey = parts[2];
		const value = interaction.values[0];

		if (moduleName && propertyKey && value) {
			await this.updateConfig(
				client,
				interaction,
				moduleName,
				propertyKey,
				value,
				EConfigType.StringChoice,
				false,
				true,
			);
		}
	}

	async show(
		interaction: RepliableInteraction,
		propertyOptions: ConfigPropertyOptions,
		selectedProperty: string,
		moduleName: string,
	) {
		const lng = await this.configService.getLanguage(interaction.guild!);
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
		const embed = this.buildPropertyEmbed(
			propertyOptions,
			selectedProperty,
			currentValue,
			{ locale: lng, t },
		);

		const rawValue = await this.configHelper.fetchValue(
			interaction.guild!,
			selectedProperty,
			propertyOptions.type,
		);
		const valueToUse = rawValue ?? defaultValue;

		const messageId = interaction.isMessageComponent()
			? interaction.message.id
			: "";

		const choices = propertyOptions.choices || [];
		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId(
				ConfigHelper.buildCustomId([
					"module_config_choice",
					moduleName,
					selectedProperty,
					messageId,
					interaction.user.id,
				]),
			)
			.setPlaceholder(t("utils.config_helper.select_placeholder"))
			.addOptions(
				choices.map((choice) => {
					const label =
						choice.nameLocalizations?.[lng as Locale] ||
						choice.name;
					return new StringSelectMenuOptionBuilder()
						.setLabel(label)
						.setValue(choice.value)
						.setDefault(valueToUse === choice.value);
				}),
			);

		const row =
			new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
				selectMenu,
			);

		const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
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
			components: [row, buttonRow],
		});
	}
}
