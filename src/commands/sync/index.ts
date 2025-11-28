import {
	ChatInputCommandInteraction,
	Client,
	MessageFlags,
	AttachmentBuilder,
} from "discord.js";
import { BaseCommand } from "../../class/BaseCommand";
import { Command } from "../../decorators/Command";
import { Subcommand } from "../../decorators/Subcommand";
import { EPermission } from "../../enums/EPermission";
import { syncOptions } from "./syncOptions";
import { BackupService } from "../../services/BackupService";
import axios from "axios";

@Command(syncOptions)
export default class SyncCommand extends BaseCommand {
	@Subcommand({ name: "backup", permission: EPermission.SyncBackup })
	async backup(client: Client, interaction: ChatInputCommandInteraction) {
		await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

		try {
			const buffer = await BackupService.createBackup();
			const attachment = new AttachmentBuilder(buffer, {
				name: `backup-${new Date().toISOString().replace(/:/g, "-")}.bin`,
			});

			await interaction.editReply({
				content: "Backup created successfully.",
				files: [attachment],
			});
		} catch (error) {
			console.error(error);
			await interaction.editReply({
				content: "An error occurred while creating the backup.",
			});
		}
	}

	@Subcommand({ name: "restore", permission: EPermission.SyncRestore })
	async restore(client: Client, interaction: ChatInputCommandInteraction) {
		const attachment = interaction.options.getAttachment("file", true);

		await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

		try {
			const response = await axios.get(attachment.url, {
				responseType: "arraybuffer",
			});
			const buffer = Buffer.from(response.data);

			await BackupService.restoreBackup(buffer);

			await interaction.editReply({
				content: "Backup restored successfully.",
			});
		} catch (error) {
			console.error(error);
			await interaction.editReply({
				content: "An error occurred while restoring the backup. Please ensure the file is valid.",
			});
		}
	}
}
