import { BaseCommand } from "@class/BaseCommand";
import { BotPermission } from "@decorators/BotPermission";
import { Command } from "@decorators/Command";
import { DefaultCommand } from "@decorators/DefaultCommand";
import { EPermission } from "@enums/EPermission";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import { GeneralConfig } from "@src/modules/General/GeneralConfig";
import {
	ChatInputCommandInteraction,
	Client,
	PermissionsBitField,
	TextChannel,
} from "discord.js";
import { lockOptions } from "./lockOptions";

@Command(lockOptions)
export default class LockCommand extends BaseCommand {
	@DefaultCommand(EPermission.Lock)
	@BotPermission(PermissionsBitField.Flags.ManageChannels)
	async run(client: Client, interaction: ChatInputCommandInteraction) {
		await interaction.deferReply();
		const lng = await ConfigService.of(interaction.guildId!, GeneralConfig)
			.generalLanguage;
		const t = I18nService.getFixedT(lng);
		const target = interaction.options.getString("target") || "channel";
		const reason =
			interaction.options.getString("reason") || t("common.no_reason");
		const guild = interaction.guild;

		if (!guild) return;

		if (target === "channel") {
			const channel = interaction.channel;
			if (!channel || !("permissionOverwrites" in channel)) {
				return interaction.editReply({
					content: t(
						"modules.moderation.commands.lock.channel_error",
					),
				});
			}

			await (channel as TextChannel).permissionOverwrites.edit(
				guild.roles.everyone,
				{
					SendMessages: false,
				},
				{ reason: `Lock Command: ${reason}` },
			);

			await interaction.editReply({
				content: t("modules.moderation.commands.lock.channel_success", {
					reason: reason,
				}),
			});
		} else if (target === "server") {
			if (
				!interaction.memberPermissions?.has(
					PermissionsBitField.Flags.Administrator,
				)
			) {
				return interaction.editReply({
					content: t(
						"modules.moderation.commands.lock.server_admin_error",
					),
				});
			}

			const everyoneRole = guild.roles.everyone;
			const newPermissions = new PermissionsBitField(
				everyoneRole.permissions,
			);
			newPermissions.remove(PermissionsBitField.Flags.SendMessages);

			await everyoneRole.setPermissions(
				newPermissions,
				`Server Lock Command: ${reason}`,
			);
			await interaction.editReply({
				content: t("modules.moderation.commands.lock.server_success", {
					reason: reason,
				}),
			});
		}
	}
}
