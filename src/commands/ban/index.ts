import { ChatInputCommandInteraction, Client, MessageFlags, PermissionsBitField } from "discord.js";
import { BaseCommand } from "../../class/BaseCommand";
import { Command } from "../../decorators/Command";
import { DefaultCommand } from "../../decorators/DefaultCommand";
import { EPermission } from "../../enums/EPermission";
import { banOptions } from "./banOptions";
import { prismaClient } from "../../services/prismaService";
import { SanctionType } from "../../prisma/client/enums";
import { BotPermission } from "../../decorators/BotPermission";

@Command(banOptions)
export default class BanCommand extends BaseCommand {
    @DefaultCommand(EPermission.Ban)
    @BotPermission(PermissionsBitField.Flags.BanMembers)
    async run(client: Client, interaction: ChatInputCommandInteraction) {
        const user = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("reason") || "No reason provided";
        const deleteMessagesDays = interaction.options.getInteger("delete_messages") || 0;

        let member = interaction.guild?.members.cache.get(user.id);
        if (!member) {
            try {
                member = await interaction.guild?.members.fetch(user.id);
            } catch (e) {
                // User likely not in guild, proceed with hackban
            }
        }

        if (member && !member.bannable) {
            await interaction.reply({ content: "I cannot ban this user.", flags: [MessageFlags.Ephemeral] });
            return;
        }

        try {
            try {
                await user.send(`You have been banned from ${interaction.guild?.name}. Reason: ${reason}`);
            } catch (e) {
                // Could not send DM
            }

            await interaction.guild?.members.ban(user, {
                reason: reason,
                deleteMessageSeconds: deleteMessagesDays * 24 * 60 * 60,
            });

            // Ensure user exists in DB
            await prismaClient.user.upsert({
                where: { id: user.id },
                update: {},
                create: { id: user.id },
            });

            // Ensure moderator exists in DB
            await prismaClient.user.upsert({
                where: { id: interaction.user.id },
                update: {},
                create: { id: interaction.user.id },
            });

            await prismaClient.sanction.create({
                data: {
                    userId: user.id,
                    moderatorId: interaction.user.id,
                    type: SanctionType.BAN,
                    reason: reason,
                },
            });

            await interaction.reply(`User ${user.tag} has been banned. Reason: ${reason}`);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "An error occurred while banning the user.", flags: [MessageFlags.Ephemeral] });
        }
    }
}
