import {
	ChatInputCommandInteraction,
	Client,
	MessageFlags,
	PermissionsBitField,
} from "discord.js";
import { BaseCommand } from "../../class/BaseCommand";
import { Command } from "../../decorators/Command";
import { DefaultCommand } from "../../decorators/DefaultCommand";
import { EPermission } from "../../enums/EPermission";
import { unbanOptions } from "./unbanOptions";
import { BotPermission } from "../../decorators/BotPermission";
import { SanctionService } from "../../services/SanctionService";

@Command(unbanOptions)
export default class UnbanCommand extends BaseCommand {
	@DefaultCommand(EPermission.Unban)
	@BotPermission(PermissionsBitField.Flags.BanMembers)
	async run(client: Client, interaction: ChatInputCommandInteraction) {
		const user = interaction.options.getUser("user", true);
		const reason =
			interaction.options.getString("reason") || "No reason provided";

		if (!interaction.guild) return;

		try {
			await SanctionService.unban(interaction.guild, user, reason);
			await interaction.reply(
				`User ${user.tag} has been unbanned. Reason: ${reason}`,
			);
		} catch (error: any) {
			await interaction.reply({
				content:
					error.message ||
					"An error occurred while unbanning the user.",
				flags: [MessageFlags.Ephemeral],
			});
		}
	}
}
