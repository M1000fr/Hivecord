import { LeBotClient } from "@class/LeBotClient";
import type { ConfigPropertyOptions } from "@decorators/ConfigProperty";
import { ConfigContextVariable } from "@enums/ConfigContextVariable";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import { I18nService } from "@modules/Core/services/I18nService";
import { GeneralConfig } from "@modules/General/GeneralConfig";
import { ConfigHelper } from "@utils/ConfigHelper";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	Guild,
	type RepliableInteraction,
	StringSelectMenuBuilder,
	StringSelectMenuInteraction,
	StringSelectMenuOptionBuilder,
} from "discord.js";
import { BaseConfigTypeHandler } from "./BaseConfigTypeHandler";

export interface SelectOption {
	label: string;
	value: string;
	description?: string;
}

export abstract class BaseSelectConfigHandler extends BaseConfigTypeHandler {
	constructor(configHelper: ConfigHelper, configService: ConfigService) {
		super(configHelper, configService);
	}

	/**
	 * The prefix used for custom IDs of this handler
	 */
	abstract get customIdPrefix(): string;

	/**
	 * Get the options to display in the select menu
	 */
	abstract getOptions(guild: Guild): Promise<SelectOption[]>;

	/**
	 * Get the placeholder for the select menu when no options are found
	 */
	protected getNoOptionsPlaceholder(t: (key: string) => string): string {
		return t("utils.config_helper.no_options_found");
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

		const module = (interaction.client as LeBotClient).modules.get(
			moduleName.toLowerCase(),
		);
		const configContexts = (
			module?.options.config as unknown as {
				configContexts?: Record<string, ConfigContextVariable[]>;
			}
		)?.configContexts;

		const embed = this.buildPropertyEmbed(
			propertyOptions,
			selectedProperty,
			currentValue,
			{ locale: lng, t },
			configContexts,
		);

		const options = await this.getOptions(interaction.guild!);

		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId(
				ConfigHelper.buildCustomId([
					this.customIdPrefix,
					moduleName,
					selectedProperty,
					interaction.user.id,
				]),
			)
			.setPlaceholder(t("utils.config_helper.select_value_placeholder"));

		if (options.length === 0) {
			selectMenu
				.setPlaceholder(this.getNoOptionsPlaceholder(t))
				.setDisabled(true);
			selectMenu.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel("None")
					.setValue("none"),
			);
		} else {
			selectMenu.addOptions(
				options.map((opt) => {
					const builder = new StringSelectMenuOptionBuilder()
						.setLabel(opt.label)
						.setValue(opt.value)
						.setDefault(currentValue === opt.value);

					if (opt.description) {
						builder.setDescription(opt.description);
					}

					return builder;
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
					t("common.clear"),
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
				t("common.cancel"),
				ButtonStyle.Secondary,
			),
		);

		await interaction.reply({
			embeds: [embed],
			components: [row, buttonRow],
		});
	}

	async handleSelection(interaction: StringSelectMenuInteraction) {
		const ctx = await this.getInteractionContext(interaction);
		if (!ctx) return;

		const { client, parts } = ctx;
		const moduleName = parts[1];
		const propertyKey = parts[2];
		const value = interaction.values[0];

		if (moduleName && propertyKey && value) {
			const { propertyOptions } = this.getPropertyContext(
				client,
				moduleName,
				propertyKey,
			);
			if (propertyOptions) {
				await this.updateConfig(
					client,
					interaction,
					moduleName,
					propertyKey,
					value,
					propertyOptions.type,
					false,
					true,
				);
			}
		}
	}
}
