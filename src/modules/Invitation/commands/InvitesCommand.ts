import { BaseCommand } from "@class/BaseCommand";
import { Command } from "@decorators/Command";
import { Subcommand } from "@decorators/Subcommand";
import { EPermission } from "@enums/EPermission";
import {
	ApplicationCommandOptionType,
	ChatInputCommandInteraction,
	Client,
	EmbedBuilder,
} from "discord.js";
import { InvitationService } from "../services/InvitationService";

@Command({
	name: "invites",
	description: "Invitation system commands",
	options: [
		{
			name: "view",
			description: "Check user invites",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "user",
					description: "The user to check",
					type: ApplicationCommandOptionType.User,
					required: false,
				},
			],
		},
		{
			name: "top",
			description: "View invites leaderboard",
			type: ApplicationCommandOptionType.Subcommand,
		},
	],
})
export default class InvitesCommand extends BaseCommand {
	@Subcommand({ name: "view", permission: EPermission.Invites })
	async view(client: Client, interaction: ChatInputCommandInteraction) {
		const targetUser =
			interaction.options.getUser("user") || interaction.user;

		const counts = await InvitationService.getInviteCounts(targetUser.id);

		const embed = new EmbedBuilder()
			.setTitle(`Invites for ${targetUser.username}`)
			.setColor("#0099ff")
			.addFields(
				{
					name: "Active",
					value: counts.active.toString(),
					inline: true,
				},
				{
					name: "Fake (Left)",
					value: counts.fake.toString(),
					inline: true,
				},
				{
					name: "Total",
					value: (counts.active + counts.fake).toString(),
					inline: true,
				},
			)
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	}

	@Subcommand({ name: "top", permission: EPermission.Invites })
	async top(client: Client, interaction: ChatInputCommandInteraction) {
		const leaderboard = await InvitationService.getLeaderboard(10);

		if (leaderboard.length === 0) {
			await interaction.reply({
				content: "No invitations found.",
				ephemeral: true,
			});
			return;
		}

		const embed = new EmbedBuilder()
			.setTitle("🏆 Invites Leaderboard")
			.setColor("#FFD700")
			.setDescription(
				leaderboard
					.map((entry, index) => {
						const medal =
							index === 0
								? "🥇"
								: index === 1
									? "🥈"
									: index === 2
										? "🥉"
										: `${index + 1}.`;
						return `${medal} <@${entry.inviterId}> • **${entry.active}** active (${entry.total} total)`;
					})
					.join("\n"),
			)
			.setFooter({ text: "Sorted by active invites" })
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	}
}
