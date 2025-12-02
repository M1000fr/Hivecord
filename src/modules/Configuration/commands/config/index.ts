import {
	ChatInputCommandInteraction,
	Client,
	AttachmentBuilder,
	MessageFlags,
} from "discord.js";
import { BaseCommand } from "@class/BaseCommand";
import { Command } from "@decorators/Command";
import { Subcommand } from "@decorators/Subcommand";
import { EPermission } from "@enums/EPermission";
import { configOptions } from "./configOptions";
import { LeBotClient } from "@class/LeBotClient";
import { BackupService } from "@modules/Configuration/services/BackupService";
import { InteractionHelper } from "@utils/InteractionHelper";

@Command(configOptions)
export default class ConfigCommand extends BaseCommand {
	@Subcommand({ name: "backup", permission: EPermission.ConfigureModules })
	async backup(client: Client, interaction: ChatInputCommandInteraction) {
		const lebot = client as LeBotClient<true>;

		await InteractionHelper.defer(interaction, true);

		try {
			const buffer = await BackupService.createBackup(lebot);
			const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
			const filename = `config-backup-${timestamp}.enc`;

			const attachment = new AttachmentBuilder(buffer, {
				name: filename,
			});

			await interaction.editReply({
				content: "✅ Configuration backup created successfully!",
				files: [attachment],
			});
		} catch (error) {
			console.error("Backup creation failed:", error);
			await InteractionHelper.respondError(
				interaction,
				"Failed to create backup. Please check the logs for details.",
			);
		}
	}

	@Subcommand({ name: "restore", permission: EPermission.ConfigureModules })
	async restore(client: Client, interaction: ChatInputCommandInteraction) {
		await InteractionHelper.defer(interaction, true);

		try {
			const attachment = interaction.options.getAttachment("file", true);

			if (!attachment.name.endsWith(".enc")) {
				await InteractionHelper.respondError(
					interaction,
					"Invalid file format. Please provide an encrypted backup file (.enc)",
				);
				return;
			}

			// Download the file
			const response = await fetch(attachment.url);
			if (!response.ok) {
				throw new Error("Failed to download backup file");
			}

			const arrayBuffer = await response.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);

			// Restore the backup
			await BackupService.restoreBackup(buffer);

			await InteractionHelper.respondSuccess(
				interaction,
				"Configuration backup restored successfully! All module configurations have been updated.",
			);
		} catch (error) {
			console.error("Backup restoration failed:", error);
			const errorMessage =
				error instanceof Error
					? error.message
					: "Failed to restore backup. Please check the logs for details.";

			await InteractionHelper.respondError(interaction, errorMessage);
		}
	}
}
