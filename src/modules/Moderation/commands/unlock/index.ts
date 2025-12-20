import { BaseCommand } from "@class/BaseCommand";
import { BotPermission } from "@decorators/BotPermission";
import { Command } from "@decorators/Command";
import { DefaultCommand } from "@decorators/DefaultCommand";
import { EPermission } from "@enums/EPermission";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import { GeneralConfig } from "@src/modules/General/GeneralConfig";
import { InteractionHelper } from "@src/utils/InteractionHelper";
import {
	ChatInputCommandInteraction,
	Client,
	PermissionsBitField,
	TextChannel,
} from "discord.js";
import { unlockOptions } from "./unlockOptions";

@Command(unlockOptions)
export default class UnlockCommand extends BaseCommand {
	@DefaultCommand(EPermission.Unlock)
	@BotPermission(PermissionsBitField.Flags.ManageChannels)
	async run(client: Client, interaction: ChatInputCommandInteraction) {
		await InteractionHelper.defer(interaction);
		const lng = await ConfigService.of(interaction.guildId!, GeneralConfig)
			.generalLanguage;
		const t = I18nService.getFixedT(lng);
		const target = interaction.options.getString("target") || "channel";
		const reason =
			interaction.options.getString("reason") ||
			t("modules.moderation.commands.unlock.default_reason");
		const guild = interaction.guild;

		if (!guild) return;

		if (target === "channel") {
			const channel = interaction.channel;
			if (!channel || !("permissionOverwrites" in channel)) {
				return InteractionHelper.respond(interaction, {
					content: t(
						"modules.moderation.commands.unlock.cannot_unlock_channel",
					),
				});
			}

			await (channel as TextChannel).permissionOverwrites.edit(
				guild.roles.everyone,
				{
					SendMessages: null,
				},
				{ reason: `Unlock Command: ${reason}` },
			);

			await InteractionHelper.respond(interaction, {
				content: t(
					"modules.moderation.commands.unlock.channel_success",
					{
						reason,
					},
				),
			});
		} else if (target === "server") {
			if (
				!interaction.memberPermissions?.has(
					PermissionsBitField.Flags.Administrator,
				)
			) {
				return InteractionHelper.respond(interaction, {
					content: t(
						"modules.moderation.commands.unlock.admin_required",
					),
				});
			}

			const everyoneRole = guild.roles.everyone;
			const newPermissions = new PermissionsBitField(
				everyoneRole.permissions,
			);
			newPermissions.add(PermissionsBitField.Flags.SendMessages);

			await everyoneRole.setPermissions(
				newPermissions,
				`Server Unlock Command: ${reason}`,
			);
			await InteractionHelper.respond(interaction, {
				content: t(
					"modules.moderation.commands.unlock.server_success",
					{
						count: 0, // Not used in this version but kept for compatibility if key uses it
						reason,
					},
				),
			});
		}
	}
}
