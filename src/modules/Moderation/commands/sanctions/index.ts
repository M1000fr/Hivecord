import {
	ChatInputCommandInteraction,
	Client,
	EmbedBuilder,
	MessageFlags,
} from "discord.js";
import { BaseCommand } from '@class/BaseCommand';
import { Command } from '@decorators/Command';
import { DefaultCommand } from '@decorators/DefaultCommand';
import { EPermission } from '@enums/EPermission';
import { sanctionsOptions } from "./sanctionsOptions";
import { prismaClient } from '@services/prismaService';
import { Pager } from '@class/Pager';

@Command(sanctionsOptions)
export default class SanctionsCommand extends BaseCommand {
	@DefaultCommand(EPermission.SanctionsList)
	async run(client: Client, interaction: ChatInputCommandInteraction) {
		const targetUser = interaction.options.getUser("user", true);

		const sanctions = await prismaClient.sanction.findMany({
			where: { userId: targetUser.id },
			orderBy: { createdAt: "desc" },
			include: { Moderator: true },
		});

		if (sanctions.length === 0) {
			await interaction.reply({
				content: `No sanctions found for ${targetUser.tag}.`,
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		const pager = new Pager({
			items: sanctions,
			itemsPerPage: 10,
			renderPage: async (items, pageIndex, totalPages) => {
				const embed = new EmbedBuilder()
					.setTitle(`Sanctions for ${targetUser.tag}`)
					.setColor("Red")
					.setTimestamp()
					.setFooter({
						text: `Page ${pageIndex + 1}/${totalPages} • Total: ${sanctions.length}`,
					});

				items.forEach((sanction) => {
					const moderator = sanction.Moderator
						? `<@${sanction.moderatorId}>`
						: "Unknown";
					const date = new Date(
						sanction.createdAt,
					).toLocaleDateString();

					let emoji = "";
					switch (sanction.type) {
						case "WARN":
							emoji = "`⚠️`";
							break;
						case "MUTE":
							emoji = "`🔇`";
							break;
						case "KICK":
							emoji = "`👢`";
							break;
						case "BAN":
							emoji = "`🔨`";
							break;
					}

					let statusInfo = "";
					if (sanction.type === "MUTE" || sanction.type === "BAN") {
						if (sanction.active) {
							statusInfo = "\n**Status:** `✅`";
							if (sanction.expiresAt) {
								const expires = Math.floor(
									new Date(sanction.expiresAt).getTime() /
										1000,
								);
								statusInfo += ` (Expires <t:${expires}:f>)`;
							} else {
								statusInfo += " (Permanent)";
							}
						} else {
							statusInfo = "\n**Status:** `❌`";
						}
					}

					embed.addFields({
						name: `${emoji} ${sanction.type} #${sanction.id} - ${date}`,
						value: `**Reason:** ${sanction.reason}\n**Moderator:** ${moderator}${statusInfo}`,
						inline: false,
					});
				});

				return { embeds: [embed], components: [] };
			},
		});

		await pager.start(interaction);
	}
}
