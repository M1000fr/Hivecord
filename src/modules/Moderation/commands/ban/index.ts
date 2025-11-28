import {
	ChatInputCommandInteraction,
	Client,
	MessageFlags,
	PermissionsBitField,
} from "discord.js";
import { BaseCommand } from '@class/BaseCommand';
import { Command } from '@decorators/Command';
import { DefaultCommand } from '@decorators/DefaultCommand';
import { EPermission } from '@enums/EPermission';
import { banOptions } from "./banOptions";
import { BotPermission } from '@decorators/BotPermission';
import { SanctionService } from '@services/SanctionService';

@Command(banOptions)
export default class BanCommand extends BaseCommand {
	@DefaultCommand(EPermission.Ban)
	@BotPermission(PermissionsBitField.Flags.BanMembers)
	async run(client: Client, interaction: ChatInputCommandInteraction) {
		const user = interaction.options.getUser("user", true);
		const reason =
			interaction.options.getString("reason") || "No reason provided";
		const deleteMessagesDays =
			interaction.options.getInteger("delete_messages") || 0;

		if (!interaction.guild) return;

		try {
			await SanctionService.ban(
				interaction.guild,
				user,
				interaction.user,
				reason,
				deleteMessagesDays * 24 * 60 * 60,
			);
			await interaction.reply(
				`User ${user.tag} has been banned. Reason: ${reason}`,
			);
		} catch (error: any) {
			await interaction.reply({
				content:
					error.message ||
					"An error occurred while banning the user.",
				flags: [MessageFlags.Ephemeral],
			});
		}
	}
}
