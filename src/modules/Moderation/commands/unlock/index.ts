import { BaseCommand } from "@class/BaseCommand";
import { BotPermission } from "@decorators/BotPermission";
import { Command } from "@decorators/Command";
import { DefaultCommand } from "@decorators/DefaultCommand";
import { EPermission } from "@enums/EPermission";
import {
	ChatInputCommandInteraction,
	Client,
	MessageFlags,
	PermissionsBitField,
	TextChannel,
} from "discord.js";
import { unlockOptions } from "./unlockOptions";

@Command(unlockOptions)
export default class UnlockCommand extends BaseCommand {
	@DefaultCommand(EPermission.Unlock)
	@BotPermission(PermissionsBitField.Flags.ManageChannels)
	async run(client: Client, interaction: ChatInputCommandInteraction) {
		const target = interaction.options.getString("target") || "channel";
		const reason =
			interaction.options.getString("reason") || "No reason provided";
		const guild = interaction.guild;

		if (!guild) return;

		if (target === "channel") {
			const channel = interaction.channel;
			if (!channel || !("permissionOverwrites" in channel)) {
				return interaction.reply({
					content: "This channel cannot be unlocked.",
					flags: [MessageFlags.Ephemeral],
				});
			}

			await (channel as TextChannel).permissionOverwrites.edit(
				guild.roles.everyone,
				{
					SendMessages: null,
				},
				{ reason: `Unlock Command: ${reason}` },
			);

			await interaction.reply({
				content: `🔓 Channel unlocked. Reason: ${reason}`,
			});
		} else if (target === "server") {
			if (
				!interaction.memberPermissions?.has(
					PermissionsBitField.Flags.Administrator,
				)
			) {
				return interaction.reply({
					content:
						"You need Administrator permission to unlock the server.",
					flags: [MessageFlags.Ephemeral],
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
			await interaction.reply({
				content: `✅ **SERVER UNLOCKED**. Reason: ${reason}`,
			});
		}
	}
}
