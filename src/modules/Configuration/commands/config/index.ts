import { BaseCommand } from "@class/BaseCommand";
import { LeBotClient } from "@class/LeBotClient";
import { Command } from "@decorators/Command";
import { Subcommand } from "@decorators/Subcommand";
import { EPermission } from "@enums/EPermission";
import { BackupService } from "@modules/Configuration/services/BackupService";
import { GeneralConfig } from "@modules/General/GeneralConfig";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import { InteractionHelper } from "@utils/InteractionHelper";
import {
	AttachmentBuilder,
	ChatInputCommandInteraction,
	Client,
} from "discord.js";
import { configOptions } from "./configOptions";

@Command(configOptions)
export default class ConfigCommand extends BaseCommand {
	@Subcommand({ name: "backup", permission: EPermission.ConfigureModules })
	async backup(client: Client, interaction: ChatInputCommandInteraction) {
		await InteractionHelper.defer(interaction, true);
		const lng = await ConfigService.of(interaction.guildId!, GeneralConfig)
			.generalLanguage;
		const t = I18nService.getFixedT(lng);
		const lebot = client as LeBotClient<true>;

		try {
			const buffer = await BackupService.createBackup(
				lebot,
				interaction.guildId!,
			);
			const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
			const filename = `config-backup-${timestamp}.enc`;

			const attachment = new AttachmentBuilder(buffer, {
				name: filename,
			});

			await InteractionHelper.respond(interaction, {
				content: t(
					"modules.configuration.commands.config.backup_success",
				),
				files: [attachment],
			});
		} catch (error) {
			console.error("Backup creation failed:", error);
			await InteractionHelper.respond(interaction, {
				content: t(
					"modules.configuration.commands.config.backup_failed",
				),
			});
		}
	}

	@Subcommand({ name: "restore", permission: EPermission.ConfigureModules })
	async restore(client: Client, interaction: ChatInputCommandInteraction) {
		const lng = await ConfigService.of(interaction.guildId!, GeneralConfig)
			.generalLanguage;
		const t = I18nService.getFixedT(lng);
		await InteractionHelper.defer(interaction, true);

		try {
			const attachment = interaction.options.getAttachment("file", true);

			if (!attachment.name.endsWith(".enc")) {
				await InteractionHelper.respond(interaction, {
					content: t(
						"modules.configuration.commands.config.invalid_file",
					),
				});
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
			await BackupService.restoreBackup(buffer, interaction.guildId!);

			await InteractionHelper.respond(interaction, {
				content: t(
					"modules.configuration.commands.config.restore_success",
				),
			});
		} catch (error) {
			console.error("Backup restoration failed:", error);
			const errorMessage =
				error instanceof Error
					? error.message
					: t("modules.configuration.commands.config.restore_failed");

			await InteractionHelper.respond(interaction, {
				content: errorMessage,
			});
		}
	}
}
