import type { ConfigPropertyOptions } from "@decorators/ConfigProperty";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import { InteractionRegistry } from "@registers/InteractionRegistry";
import { ConfigUIBuilderService } from "@utils/ConfigUIBuilderService";
import { ConfigValueResolverService } from "@utils/ConfigValueResolverService";
import { ConfigValueService } from "@utils/ConfigValueService";
import { CustomIdHelper } from "@utils/CustomIdHelper";
import {
	ActionRowBuilder,
	ButtonBuilder,
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
	constructor(
		valueService: ConfigValueService,
		uiBuilder: ConfigUIBuilderService,
		resolverService: ConfigValueResolverService,
		configService: ConfigService,
	) {
		super(valueService, uiBuilder, resolverService, configService);
	}

	/**
	 * The prefix used for custom IDs of this handler
	 */
	abstract get customIdPrefix(): string;

	override registerInteractions() {
		InteractionRegistry.registerSelectMenuPattern(
			`${this.customIdPrefix}:*`,
			(interaction) =>
				this.handleSelection(
					interaction as StringSelectMenuInteraction,
				),
		);
	}

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
		const { t, embed, messageId, currentValue } = await this.getShowContext(
			interaction,
			moduleName,
			selectedProperty,
			propertyOptions,
		);

		const options = await this.getOptions(interaction.guild!);

		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId(
				CustomIdHelper.build([
					this.customIdPrefix,
					moduleName,
					selectedProperty,
					messageId,
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
				this.createClearButton(
					moduleName,
					selectedProperty,
					interaction.user.id,
					t,
					messageId,
				),
			);
		}

		buttonRow.addComponents(
			this.createCancelButton(
				moduleName,
				selectedProperty,
				interaction.user.id,
				t,
			),
		);

		await interaction.reply({
			embeds: [embed],
			components: [row, buttonRow],
		});
	}

	async handleSelection(interaction: StringSelectMenuInteraction) {
		const ctx = await this.getHandleContext(interaction);
		if (!ctx) return;

		const { client, moduleName, propertyKey, propertyOptions } = ctx;
		const value = interaction.values[0];

		if (value) {
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
