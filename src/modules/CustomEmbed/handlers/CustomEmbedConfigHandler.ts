import type { ConfigPropertyOptions } from "@decorators/ConfigProperty";
import { Injectable } from "@decorators/Injectable";
import { SelectMenu } from "@decorators/Interaction";
import { Interaction } from "@decorators/params";
import { BaseConfigInteractions } from "@modules/Configuration/interactions/config/BaseConfigInteractions";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import { I18nService } from "@modules/Core/services/I18nService";
import { CustomEmbedRepository } from "@src/repositories";
import { GeneralConfig } from "@modules/General/GeneralConfig";
import type { ConfigTypeHandler } from "@registers/ConfigTypeRegistry";
import { ConfigTypeRegistry } from "@registers/ConfigTypeRegistry";
import { ConfigHelper } from "@utils/ConfigHelper";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	type RepliableInteraction,
	type StringSelectMenuInteraction,
} from "discord.js";
import { CUSTOM_EMBED_CONFIG_KEY } from "../CustomEmbedConfigKey";

@Injectable()
export class CustomEmbedConfigHandler
	extends BaseConfigInteractions
	implements ConfigTypeHandler
{
	constructor(
		configHelper: ConfigHelper,
		configService: ConfigService,
		private readonly customEmbedRepository: CustomEmbedRepository,
	) {
		super(configHelper, configService);
		ConfigTypeRegistry.register({
			id: CUSTOM_EMBED_CONFIG_KEY,
			name: "Custom Embed",
			handler: this,
		});
	}

	@SelectMenu("module_config_custom_embed:*")
	async handleEmbedSelection(
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
				CUSTOM_EMBED_CONFIG_KEY,
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
		const lng = await this.configService.of(
			interaction.guild!,
			GeneralConfig,
		).Language;
		const t = I18nService.getFixedT(lng);
		const currentValue = await this.configHelper.getCurrentValue(
			interaction.guild!,
			selectedProperty,
			propertyOptions.type,
			t,
		);
		const embed = this.buildPropertyEmbed(
			propertyOptions,
			selectedProperty,
			currentValue,
			{ locale: lng, t },
		);

		// Fetch custom embeds for this guild
		const customEmbeds = await this.customEmbedRepository.listNames(
			interaction.guild!,
		);

		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId(
				ConfigHelper.buildCustomId([
					"module_config_custom_embed",
					moduleName,
					selectedProperty,
					interaction.user.id,
				]),
			)
			.setPlaceholder(t("utils.config_helper.select_placeholder"));

		if (customEmbeds.length === 0) {
			selectMenu
				.setPlaceholder("No custom embeds found")
				.setDisabled(true);
			selectMenu.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel("None")
					.setValue("none"),
			);
		} else {
			selectMenu.addOptions(
				customEmbeds.map((name) => {
					return new StringSelectMenuOptionBuilder()
						.setLabel(name)
						.setValue(name)
						.setDefault(currentValue === name);
				}),
			);
		}

		const row =
			new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
				selectMenu,
			);

		const buttonRow = new ActionRowBuilder<ButtonBuilder>();

		if (!propertyOptions.nonNull) {
			buttonRow.addComponents(
				this.createConfigButton(
					"module_config_clear",
					moduleName,
					selectedProperty,
					interaction.user.id,
					"Clear Selection",
					ButtonStyle.Danger,
				),
			);
		}

		buttonRow.addComponents(
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

	// Helper to get interaction context (copied from BaseConfigInteractions if not public/protected)
	// Actually getInteractionContext is protected in BaseConfigInteractions
}
