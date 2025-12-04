import { BaseCommand } from "@class/BaseCommand";
import { LeBotClient } from "@class/LeBotClient";
import { BotPermission } from "@decorators/BotPermission";
import { Command } from "@decorators/Command";
import { Subcommand } from "@decorators/Subcommand";
import { EPermission } from "@enums/EPermission";
import { InteractionHelper } from "@utils/InteractionHelper";
import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { WelcomeRoleSyncService } from "../../services/WelcomeRoleSyncService";
import { syncOptions } from "./syncOptions";

@Command(syncOptions)
export default class SyncCommand extends BaseCommand {
	@Subcommand({
		name: "welcome-roles",
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
