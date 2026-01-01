import type { LeBotClient } from "@class/LeBotClient";
import type { ConfigPropertyOptions } from "@decorators/ConfigProperty";
import { ConfigContextVariable } from "@enums/ConfigContextVariable";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import { I18nService } from "@modules/Core/services/I18nService";
import { InteractionRegistry } from "@registers/InteractionRegistry";
import type { ConfigHelper } from "@utils/ConfigHelper";
import {
	ActionRowBuilder,
	ButtonStyle,
	type ButtonBuilder,
	type ButtonInteraction,
	type RepliableInteraction,
} from "discord.js";
import { BaseConfigTypeHandler } from "./BaseConfigTypeHandler";

export abstract class BaseToggleConfigHandler extends BaseConfigTypeHandler {
	constructor(configHelper: ConfigHelper, configService: ConfigService) {
		super(configHelper, configService);
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

	async handleToggle(interaction: ButtonInteraction) {
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

		if (!propertyOptions) return;

		const { module } = this.getPropertyContext(
			client,
			moduleName,
			propertyKey,
		);
		const defaultValue = this.getDefaultValue(module, propertyKey);

		const rawValue = await this.configHelper.fetchValue(
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
