import { BaseCommand } from "@class/BaseCommand";
import { LeBotClient } from "@class/LeBotClient";
import { Autocomplete } from "@decorators/Autocomplete";
import { BotPermission } from "@decorators/BotPermission";
import { Command } from "@decorators/Command";
import { OptionRoute } from "@decorators/OptionRoute";
import { EPermission } from "@enums/EPermission";
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
		const focusedValue = interaction.options.getFocused().toLowerCase();
		const targets = [{ name: "Welcome Roles", value: "welcome-roles" }];

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
		await InteractionHelper.defer(interaction);

		try {
			const state = await WelcomeRoleSyncService.getState();
			if (state.isRunning) {
				await InteractionHelper.respondError(
					interaction,
					"A synchronization is already in progress.",
				);
				return;
			}

			await WelcomeRoleSyncService.start(client as LeBotClient<true>);
			await InteractionHelper.respondSuccess(
				interaction,
				"Welcome roles synchronization started.",
			);
		} catch (error) {
			await InteractionHelper.respondError(
				interaction,
				"Failed to start synchronization.",
			);
		}
	}
}
