import { BaseCommand } from "@class/BaseCommand";
import { Command } from "@decorators/Command";
import { DefaultCommand } from "@decorators/DefaultCommand";
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
	description: "Check user invites",
	options: [
		{
			name: "user",
			description: "The user to check",
			type: ApplicationCommandOptionType.User,
			required: false,
		},
	],
})
export default class InvitesCommand extends BaseCommand {
	@DefaultCommand(EPermission.Invites)
	async run(client: Client, interaction: ChatInputCommandInteraction) {
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
}
