import type { LeBotClient } from "@class/LeBotClient";
import type { ConfigPropertyOptions } from "@decorators/ConfigProperty";
import { ConfigContextVariable } from "@enums/ConfigContextVariable";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import { I18nService } from "@modules/Core/services/I18nService";
import type { ConfigHelper } from "@utils/ConfigHelper";
import {
	ActionRowBuilder,
	type ButtonBuilder,
	ButtonStyle,
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

	async show(
		interaction: RepliableInteraction,
		propertyOptions: ConfigPropertyOptions,
		selectedProperty: string,
		moduleName: string,
	) {
		const lng =
			(await this.configService.get(interaction.guild!, "language")) ??
			"en";
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

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			this.createConfigButton(
				`${this.customIdPrefix}_toggle`,
				moduleName,
				selectedProperty,
				interaction.user.id,
				t("common.toggle"),
				ButtonStyle.Primary,
			),
		);

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

		const rawValue = await this.configHelper.fetchValue(
			interaction.guild!,
			propertyKey,
			propertyOptions.type,
		);

		const newValue = rawValue === "true" ? "false" : "true";

		await this.updateConfig(
			client,
			interaction,
			moduleName,
			propertyKey,
			newValue,
			propertyOptions.type,
		);
	}
}
