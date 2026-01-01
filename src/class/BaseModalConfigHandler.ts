import type { LeBotClient } from "@class/LeBotClient";
import type { ConfigPropertyOptions } from "@decorators/ConfigProperty";
import { ConfigContextVariable } from "@enums/ConfigContextVariable";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import { I18nService } from "@modules/Core/services/I18nService";
import { InteractionRegistry } from "@registers/InteractionRegistry";
import type { ConfigHelper } from "@utils/ConfigHelper";
import { CustomIdHelper } from "@utils/CustomIdHelper";
import {
	ActionRowBuilder,
	type ButtonBuilder,
	type ButtonInteraction,
	ButtonStyle,
	LabelBuilder,
	ModalBuilder,
	type ModalSubmitInteraction,
	type RepliableInteraction,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import type { TFunction } from "i18next";
import { BaseConfigTypeHandler } from "./BaseConfigTypeHandler";

export abstract class BaseModalConfigHandler extends BaseConfigTypeHandler {
	constructor(configHelper: ConfigHelper, configService: ConfigService) {
		super(configHelper, configService);
	}

	/**
	 * The prefix used for custom IDs of this handler
	 */
	abstract get customIdPrefix(): string;

	override registerInteractions() {
		InteractionRegistry.registerButtonPattern(
			`${this.customIdPrefix}_edit:*`,
			(interaction) => this.handleEdit(interaction as ButtonInteraction),
		);
		InteractionRegistry.registerModalPattern(
			`${this.customIdPrefix}_modal:*`,
			(interaction) =>
				this.handleModal(interaction as ModalSubmitInteraction),
		);
	}

	/**
	 * Get the title for the modal
	 */
	protected getModalTitle(t: TFunction): string {
		return t("utils.config_helper.modal_title");
	}

	/**
	 * Get the label for the text input
	 */
	protected getTextInputLabel(
		t: TFunction,
		propertyOptions: ConfigPropertyOptions,
	): string {
		return propertyOptions.displayName || "Value";
	}

	/**
	 * Get the style for the text input
	 */
	protected getTextInputStyle(): TextInputStyle {
		return TextInputStyle.Paragraph;
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

		const messageId = interaction.isMessageComponent()
			? interaction.message.id
			: "";

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			this.createConfigButton(
				`${this.customIdPrefix}_edit`,
				moduleName,
				selectedProperty,
				interaction.user.id,
				t("common.edit"),
				ButtonStyle.Primary,
				[messageId],
			),
		);

		if (!propertyOptions.nonNull) {
			row.addComponents(
				this.createConfigButton(
					"module_config_clear",
					moduleName,
					selectedProperty,
					interaction.user.id,
					t("common.clear"),
					ButtonStyle.Danger,
					[messageId],
				),
			);
		}

		row.addComponents(
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
			components: [row],
		});
	}

	async handleEdit(interaction: ButtonInteraction) {
		const ctx = await this.getInteractionContext(interaction);
		if (!ctx) return;

		const { parts } = ctx;
		const moduleName = parts[1];
		const propertyKey = parts[2];
		const messageId = parts[3] || "";

		if (!moduleName || !propertyKey) return;

		const { propertyOptions } = this.getPropertyContext(
			interaction.client as LeBotClient<true>,
			moduleName,
			propertyKey,
		);

		if (!propertyOptions) return;

		const lng = await this.configService.getLanguage(interaction.guild!);
		const t = I18nService.getFixedT(lng);

		const { module } = this.getPropertyContext(
			interaction.client as LeBotClient<true>,
			moduleName,
			propertyKey,
		);
		const defaultValue = this.getDefaultValue(module, propertyKey);

		const rawValue = await this.configHelper.fetchValue(
			interaction.guild!,
			propertyKey,
			propertyOptions.type,
		);

		const valueToUse = rawValue ?? defaultValue ?? "";

		const modal = new ModalBuilder()
			.setCustomId(
				CustomIdHelper.build([
					`${this.customIdPrefix}_modal`,
					moduleName,
					propertyKey,
					messageId,
					interaction.user.id,
				]),
			)
			.setTitle(this.getModalTitle(t));

		const input = new TextInputBuilder()
			.setCustomId("value")
			.setStyle(this.getTextInputStyle())
			.setValue(String(valueToUse))
			.setRequired(true);

		const label = new LabelBuilder()
			.setLabel(this.getTextInputLabel(t, propertyOptions))
			.setTextInputComponent(input);

		modal.addLabelComponents(label);

		await interaction.showModal(modal);
	}

	async handleModal(interaction: ModalSubmitInteraction) {
		const ctx = await this.getInteractionContext(interaction);
		if (!ctx) return;

		const { client, parts } = ctx;
		const moduleName = parts[1];
		const propertyKey = parts[2];

		if (!moduleName || !propertyKey) return;

		const value = interaction.fields.getTextInputValue("value");

		if (moduleName && propertyKey) {
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
