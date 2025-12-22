import { LeBotClient } from "@class/LeBotClient";
import { Autocomplete } from "@decorators/Autocomplete";
import { BotPermission } from "@decorators/BotPermission";
import { CommandController } from "@decorators/Command";
import { AutocompleteInteraction } from "@decorators/Interaction";
import { OptionRoute } from "@decorators/OptionRoute";
import { Client, GuildLanguage } from "@decorators/params/index.ts";
import { EPermission } from "@enums/EPermission";
import { WelcomeRoleSyncService } from "@modules/General/services/WelcomeRoleSyncService";
import type { CommandAutocompleteContext } from "@src/types/CommandAutocompleteContext";
import type { GuildLanguageContext } from "@src/types/GuildLanguageContext";
import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { syncOptions } from "./syncOptions";

@CommandController(syncOptions)
export default class SyncCommand {
	constructor(
		private readonly welcomeRoleSyncService: WelcomeRoleSyncService,
	) {}

	@Autocomplete({ optionName: "target" })
	async autocompleteTarget(
		@Client() client: LeBotClient,
		@AutocompleteInteraction() [interaction]: CommandAutocompleteContext,
		@GuildLanguage() lang: GuildLanguageContext,
	) {
		const focusedValue = interaction.options.getFocused().toLowerCase();
		const targets = [
			{
				name: lang.t(
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
		@GuildLanguage() lang: GuildLanguageContext,
	) {
		await interaction.deferReply();

		try {
			const state = await this.welcomeRoleSyncService.getState(
				interaction.guildId!,
			);
			if (state.isRunning) {
				await interaction.followUp({
					content: lang.t(
						"modules.general.commands.sync.in_progress",
					),
				});
				return;
			}

			await this.welcomeRoleSyncService.start(interaction.guild!);
			await interaction.followUp({
				content: lang.t("modules.general.commands.sync.started"),
			});
		} catch {
			await interaction.followUp({
				content: lang.t("modules.general.commands.sync.failed"),
			});
		}
	}
}
