import { BaseCommand } from "@class/BaseCommand";
import { LeBotClient } from "@class/LeBotClient";
import { Autocomplete } from "@decorators/Autocomplete";
import { BotPermission } from "@decorators/BotPermission";
import { Command } from "@decorators/Command";
import { OptionRoute } from "@decorators/OptionRoute";
import { EPermission } from "@enums/EPermission";
import { GeneralConfigKeys } from "@modules/General/GeneralConfig";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import { InteractionHelper } from "@utils/InteractionHelper";
import {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	PermissionFlagsBits,
} from "discord.js";
import { WelcomeRoleSyncService } from "../../services/WelcomeRoleSyncService";
import { syncOptions } from "./syncOptions";

@Command(syncOptions)
export default class SyncCommand extends BaseCommand {
	@Autocomplete({ optionName: "target" })
	async autocompleteTarget(
		client: LeBotClient,
		interaction: AutocompleteInteraction,
	) {
		const lng =
			(await ConfigService.get(
				interaction.guildId!,
				GeneralConfigKeys.language,
			)) ?? "en";
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
		const lng =
			(await ConfigService.get(
				interaction.guildId!,
				GeneralConfigKeys.language,
			)) ?? "en";
		const t = I18nService.getFixedT(lng);
		await InteractionHelper.defer(interaction);

		try {
			const state = await WelcomeRoleSyncService.getState(
				interaction.guildId!,
			);
			if (state.isRunning) {
				await InteractionHelper.respondError(
					interaction,
					t("modules.general.commands.sync.in_progress"),
				);
				return;
			}

			await WelcomeRoleSyncService.start(interaction.guild!);
			await InteractionHelper.respondSuccess(
				interaction,
				t("modules.general.commands.sync.started"),
			);
		} catch (error) {
			await InteractionHelper.respondError(
				interaction,
				t("modules.general.commands.sync.failed"),
			);
		}
	}
}
