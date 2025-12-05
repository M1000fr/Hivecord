import { BaseCommand } from "@class/BaseCommand";
import { Command } from "@decorators/Command";
import { Subcommand } from "@decorators/Subcommand";
import { EPermission } from "@enums/EPermission";
import { GeneralConfigKeys } from "@modules/General/GeneralConfig";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
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
		const lng =
			(await ConfigService.get(GeneralConfigKeys.language)) ?? "en";
		const t = I18nService.getFixedT(lng);
		const targetUser =
			interaction.options.getUser("user") || interaction.user;

		const counts = await InvitationService.getInviteCounts(targetUser.id);

		const embed = new EmbedBuilder()
			.setTitle(
				t("modules.invitation.commands.view.title", {
					username: targetUser.username,
				}),
			)
			.setColor("#0099ff")
			.addFields(
				{
					name: t("modules.invitation.commands.view.active"),
					value: counts.active.toString(),
					inline: true,
				},
				{
					name: t("modules.invitation.commands.view.fake"),
					value: counts.fake.toString(),
					inline: true,
				},
				{
					name: t("modules.invitation.commands.view.total"),
					value: (counts.active + counts.fake).toString(),
					inline: true,
				},
			)
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	}

	@Subcommand({ name: "top", permission: EPermission.Invites })
	async top(client: Client, interaction: ChatInputCommandInteraction) {
		const lng =
			(await ConfigService.get(GeneralConfigKeys.language)) ?? "en";
		const t = I18nService.getFixedT(lng);
		const leaderboard = await InvitationService.getLeaderboard(10);

		if (leaderboard.length === 0) {
			await interaction.reply({
				content: t("modules.invitation.commands.top.no_invites"),
				ephemeral: true,
			});
			return;
		}

		const embed = new EmbedBuilder()
			.setTitle(t("modules.invitation.commands.top.title"))
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
			.setFooter({ text: t("modules.invitation.commands.top.footer") })
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	}
}
