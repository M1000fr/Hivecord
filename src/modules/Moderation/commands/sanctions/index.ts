import {
	ChatInputCommandInteraction,
	Client,
	EmbedBuilder,
	MessageFlags,
    Colors
} from "discord.js";
import { BaseCommand } from '@class/BaseCommand';
import { Command } from '@decorators/Command';
import { Subcommand } from '@decorators/Subcommand';
import { EPermission } from '@enums/EPermission';
import { sanctionsOptions } from "./sanctionsOptions";
import { prismaClient } from '@services/prismaService';
import { Pager } from '@class/Pager';
import { SanctionReasonService } from '@modules/Moderation/services/SanctionReasonService';
import { SanctionType } from "@prisma/client/client";

@Command(sanctionsOptions)
export default class SanctionsCommand extends BaseCommand {
    @Subcommand({ name: "list", permission: EPermission.SanctionsList })
	async listSanctions(client: Client, interaction: ChatInputCommandInteraction) {
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
			userId: interaction.user.id,
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

    @Subcommand({ name: "add", group: "reason", permission: EPermission.ReasonAdd })
    async handleReasonAdd(client: Client, interaction: ChatInputCommandInteraction) {
        const text = interaction.options.getString("text", true);
        const typeStr = interaction.options.getString("type", true);
        const duration = interaction.options.getString("duration");

        const type = typeStr as SanctionType;

        try {
            const reason = await SanctionReasonService.create({
                text,
                type,
                duration: duration || undefined,
            });

            const embed = new EmbedBuilder()
                .setTitle("Reason Added")
                .setColor(Colors.Green)
                .setDescription(`Added reason for **${type}**:\n${text}`)
                .addFields({ name: "ID", value: reason.id.toString(), inline: true });
            
            if (duration) {
                embed.addFields({ name: "Duration", value: duration, inline: true });
            }

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply({ content: "Failed to add reason. It might already exist.", flags: [MessageFlags.Ephemeral] });
        }
    }

    @Subcommand({ name: "edit", group: "reason", permission: EPermission.ReasonEdit })
    async handleReasonEdit(client: Client, interaction: ChatInputCommandInteraction) {
        const id = interaction.options.getInteger("id", true);
        const text = interaction.options.getString("text");
        const duration = interaction.options.getString("duration");

        if (!text && !duration) {
            await interaction.reply({ content: "You must provide at least one field to update.", flags: [MessageFlags.Ephemeral] });
            return;
        }

        try {
            const reason = await SanctionReasonService.getById(id);
            if (!reason) {
                await interaction.reply({ content: `Reason with ID ${id} not found.`, flags: [MessageFlags.Ephemeral] });
                return;
            }

            if (reason.isSystem) {
                await interaction.reply({ content: "Cannot edit system reasons.", flags: [MessageFlags.Ephemeral] });
                return;
            }

            await SanctionReasonService.update(id, {
                text: text || undefined,
                duration: duration || undefined,
            });

            await interaction.reply({ content: `Reason with ID ${id} updated.`, flags: [MessageFlags.Ephemeral] });
        } catch (error) {
            await interaction.reply({ content: `Failed to update reason with ID ${id}.`, flags: [MessageFlags.Ephemeral] });
        }
    }

    @Subcommand({ name: "remove", group: "reason", permission: EPermission.ReasonRemove })
    async handleReasonRemove(client: Client, interaction: ChatInputCommandInteraction) {
        const id = interaction.options.getInteger("id", true);

        try {
            await SanctionReasonService.delete(id);
            await interaction.reply({ content: `Reason with ID ${id} removed.`, flags: [MessageFlags.Ephemeral] });
        } catch (error) {
            await interaction.reply({ content: `Failed to remove reason with ID ${id}.`, flags: [MessageFlags.Ephemeral] });
        }
    }

    @Subcommand({ name: "list", group: "reason", permission: EPermission.ReasonList })
    async handleReasonList(client: Client, interaction: ChatInputCommandInteraction) {
        const typeStr = interaction.options.getString("type");
        const type = typeStr ? (typeStr as SanctionType) : undefined;

        const reasons = type 
            ? await SanctionReasonService.getByType(type, true) 
            : await SanctionReasonService.getAll();

        if (reasons.length === 0) {
            await interaction.reply({ content: "No reasons found.", flags: [MessageFlags.Ephemeral] });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle("Sanction Reasons")
            .setColor(Colors.Blue);

        const description = reasons.map(r => {
            let line = `**${r.id}**. [${r.type}] ${r.text}`;
            if (r.duration) line += ` (${r.duration})`;
            if (r.isSystem) line += ` [SYSTEM]`;
            return line;
        }).join("\n");

        embed.setDescription(description.substring(0, 4096));

        await interaction.reply({ embeds: [embed] });
    }
}
