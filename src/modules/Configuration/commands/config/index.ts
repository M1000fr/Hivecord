import { LeBotClient } from "@class/LeBotClient";
import { CommandController } from "@decorators/Command";
import { Injectable } from "@decorators/Injectable";
import { Client } from "@decorators/params/index.ts";
import { Subcommand } from "@decorators/Subcommand";
import { EPermission } from "@enums/EPermission";
import { BackupService } from "@modules/Configuration/services/BackupService";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import { I18nService } from "@modules/Core/services/I18nService";
import { GeneralConfig } from "@modules/General/GeneralConfig";
import { CommandInteraction } from "@src/decorators/Interaction";
import {
	AttachmentBuilder,
	ChatInputCommandInteraction,
	MessageFlags,
} from "discord.js";
import { configOptions } from "./configOptions";

@Injectable()
@CommandController(configOptions)
export default class ConfigCommand {
	constructor(
		private readonly configService: ConfigService,
		private readonly backupService: BackupService,
	) {}

	@Subcommand({ permission: EPermission.ConfigureModules })
	async backup(
		@Client() client: LeBotClient<true>,
		@CommandInteraction() interaction: ChatInputCommandInteraction,
	) {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });
		const lng = await this.configService.of(
			interaction.guildId!,
			GeneralConfig,
		).generalLanguage;
		const t = I18nService.getFixedT(lng);
		const lebot = client as LeBotClient<true>;

		try {
			const buffer = await this.backupService.createBackup(
				lebot,
				interaction.guildId!,
			);
			const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
			const filename = `config-backup-${timestamp}.enc`;

			const attachment = new AttachmentBuilder(buffer, {
				name: filename,
			});

			await interaction.editReply({
				content: t(
					"modules.configuration.commands.config.backup_success",
				),
				files: [attachment],
			});
		} catch (error) {
			console.error("Backup creation failed:", error);
			await interaction.editReply({
				content: t(
					"modules.configuration.commands.config.backup_failed",
				),
			});
		}
	}

	@Subcommand({ permission: EPermission.ConfigureModules })
	async restore(
		@Client() client: LeBotClient<true>,
		@CommandInteraction() interaction: ChatInputCommandInteraction,
	) {
		const lng = await this.configService.of(
			interaction.guildId!,
			GeneralConfig,
		).generalLanguage;
		const t = I18nService.getFixedT(lng);
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		try {
			const attachment = interaction.options.getAttachment("file", true);

			if (!attachment.name.endsWith(".enc")) {
				await interaction.editReply({
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
			await this.backupService.restoreBackup(
				buffer,
				interaction.guildId!,
			);

			await interaction.editReply({
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

			await interaction.editReply({
				content: errorMessage,
			});
		}
	}
}
