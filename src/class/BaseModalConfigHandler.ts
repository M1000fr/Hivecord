import type { ConfigPropertyOptions } from "@decorators/ConfigProperty";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import { InteractionRegistry } from "@registers/InteractionRegistry";
import { ConfigValueService } from "@utils/ConfigValueService";
import { ConfigUIBuilderService } from "@utils/ConfigUIBuilderService";
import { ConfigValueResolverService } from "@utils/ConfigValueResolverService";
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
		const { t, embed, messageId } = await this.getShowContext(
			interaction,
			moduleName,
			selectedProperty,
			propertyOptions,
		);

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
				this.createClearButton(
					moduleName,
					selectedProperty,
					interaction.user.id,
					t,
					messageId,
				),
			);
		}

		row.addComponents(
			this.createCancelButton(
				moduleName,
				selectedProperty,
				interaction.user.id,
				t,
			),
		);

		await interaction.reply({
			embeds: [embed],
			components: [row],
		});
	}

	async handleEdit(interaction: ButtonInteraction) {
		const ctx = await this.getHandleContext(interaction);
		if (!ctx) return;

		const { moduleName, propertyKey, parts, module, propertyOptions } = ctx;
		const messageId = parts[3] || "";

		const { t } = await this.getLanguageContext(interaction);
		const defaultValue = this.getDefaultValue(module, propertyKey);

		const rawValue = await this.valueService.fetchValue(
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
		const ctx = await this.getHandleContext(interaction);
		if (!ctx) return;

		const { client, moduleName, propertyKey, propertyOptions } = ctx;

		const value = interaction.fields.getTextInputValue("value");

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
