import type { ConfigPropertyOptions } from "@decorators/ConfigProperty";
import { EConfigType } from "@decorators/ConfigProperty";
import { Injectable } from "@decorators/Injectable";
import { SelectMenuPattern } from "@decorators/Interaction";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import { I18nService } from "@modules/Core/services/I18nService";
import type { PrismaService } from "@modules/Core/services/PrismaService";
import { GeneralConfig } from "@modules/General/GeneralConfig";
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
import { BaseConfigInteractions } from "./BaseConfigInteractions";

@Injectable()
export class CustomEmbedConfigInteractions extends BaseConfigInteractions {
	constructor(
		configHelper: ConfigHelper,
		configService: ConfigService,
		private readonly prisma: PrismaService,
	) {
		super(configHelper, configService);
	}

	@SelectMenuPattern("module_config_custom_embed:*")
	async handleEmbedSelection(interaction: StringSelectMenuInteraction) {
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
				EConfigType.CustomEmbed,
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
			interaction.guildId!,
			GeneralConfig,
		).generalLanguage;
		const t = I18nService.getFixedT(lng);
		const currentValue = await this.configHelper.getCurrentValue(
			interaction.guildId!,
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
		const customEmbeds = await this.prisma.customEmbed.findMany({
			where: {
				guildId: interaction.guildId!,
			},
			select: {
				name: true,
			},
		});

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
				customEmbeds.map((ce) => {
					return new StringSelectMenuOptionBuilder()
						.setLabel(ce.name)
						.setValue(ce.name)
						.setDefault(currentValue === ce.name);
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
}
