import type { ConfigPropertyOptions } from "@decorators/ConfigProperty";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import { InteractionRegistry } from "@registers/InteractionRegistry";
import { ConfigValueService } from "@utils/ConfigValueService";
import { ConfigUIBuilderService } from "@utils/ConfigUIBuilderService";
import { ConfigValueResolverService } from "@utils/ConfigValueResolverService";
import {
	ActionRowBuilder,
	ButtonStyle,
	type ButtonBuilder,
	type ButtonInteraction,
	type RepliableInteraction,
} from "discord.js";
import { BaseConfigTypeHandler } from "./BaseConfigTypeHandler";

export abstract class BaseToggleConfigHandler extends BaseConfigTypeHandler {
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
			`${this.customIdPrefix}_toggle:*`,
			(interaction) =>
				this.handleToggle(interaction as ButtonInteraction),
		);
	}

	override async formatValue(
		_guildId: string,
		value: string | string[],
	): Promise<string> {
		return String(value) === "true" ? "`✅`" : "`❌`";
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
				`${this.customIdPrefix}_toggle`,
				moduleName,
				selectedProperty,
				interaction.user.id,
				t("common.toggle"),
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

	async handleToggle(interaction: ButtonInteraction) {
		const ctx = await this.getHandleContext(interaction);
		if (!ctx) return;

		const { client, moduleName, propertyKey, module, propertyOptions } =
			ctx;

		const defaultValue = this.getDefaultValue(module, propertyKey);

		const rawValue = await this.valueService.fetchValue(
			interaction.guild!,
			propertyKey,
			propertyOptions.type,
		);

		const valueToUse = rawValue ?? defaultValue;
		const newValue = String(valueToUse) === "true" ? "false" : "true";

		await this.updateConfig(
			client,
			interaction,
			moduleName,
			propertyKey,
			newValue,
			propertyOptions.type,
			false,
			true,
		);
	}
}
