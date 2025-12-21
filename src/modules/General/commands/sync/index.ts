import { LeBotClient } from "@class/LeBotClient";
import { Autocomplete } from "@decorators/Autocomplete";
import { BotPermission } from "@decorators/BotPermission";
import { CommandController } from "@decorators/Command";
import { Injectable } from "@decorators/Injectable";
import { AutocompleteInteraction } from "@decorators/Interaction";
import { OptionRoute } from "@decorators/OptionRoute";
import { Client } from "@decorators/params/Client";
import { EPermission } from "@enums/EPermission";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import { I18nService } from "@modules/Core/services/I18nService";

import { WelcomeRoleSyncService } from "@modules/General/services/WelcomeRoleSyncService";
import {
	ChatInputCommandInteraction,
	AutocompleteInteraction as DiscordAutocompleteInteraction,
	PermissionFlagsBits,
} from "discord.js";
import { GeneralConfig } from "../../GeneralConfig";
import { syncOptions } from "./syncOptions";

@Injectable()
@CommandController(syncOptions)
export default class SyncCommand {
	constructor(
		private readonly configService: ConfigService,
		private readonly welcomeRoleSyncService: WelcomeRoleSyncService,
	) {}

	@Autocomplete({ optionName: "target" })
	async autocompleteTarget(
		@Client() client: LeBotClient,
		@AutocompleteInteraction() interaction: DiscordAutocompleteInteraction,
	) {
		const lng = await this.configService.of(
			interaction.guildId!,
			GeneralConfig,
		).generalLanguage;
		const t = I18nService.getFixedT(lng);
		const focusedValue = interaction.options.getFocused().toLowerCase();
		const targets = [
			{
				name: t(
					"modules.general.commands.sync.autocomplete.welcome_roles",
				),
				value: "welcome-roles",
			},
		];

		const filtered = targets.filter((t) =>
			t.name.toLowerCase().includes(focusedValue),
		);

		await interaction.respond(filtered);
	}

	@OptionRoute({
		option: "target",
		value: "welcome-roles",
		permission: EPermission.SyncWelcomeRoles,
	})
	@BotPermission(PermissionFlagsBits.ManageRoles)
	async syncWelcomeRoles(
		client: LeBotClient,
		interaction: ChatInputCommandInteraction,
	) {
		await interaction.deferReply();
		const lng = await this.configService.of(
			interaction.guildId!,
			GeneralConfig,
		).generalLanguage;
		const t = I18nService.getFixedT(lng);

		try {
			const state = await this.welcomeRoleSyncService.getState(
				interaction.guildId!,
			);
			if (state.isRunning) {
				await interaction.followUp({
					content: t("modules.general.commands.sync.in_progress"),
				});
				return;
			}

			await this.welcomeRoleSyncService.start(interaction.guild!);
			await interaction.followUp({
				content: t("modules.general.commands.sync.started"),
			});
		} catch {
			await interaction.followUp({
				content: t("modules.general.commands.sync.failed"),
			});
		}
	}
}
