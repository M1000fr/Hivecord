import { ChatInputCommandInteraction, Client, GuildMember, MessageFlags, PermissionsBitField } from "discord.js";
import { BaseCommand } from "../../class/BaseCommand";
import { Command } from "../../decorators/Command";
import { DefaultCommand } from "../../decorators/DefaultCommand";
import { EPermission } from "../../enums/EPermission";
import { tempMuteOptions } from "./tempMuteOptions";
import { DurationParser } from "../../utils/DurationParser";
import { prismaClient } from "../../services/prismaService";
import { SanctionType } from "../../prisma/client/enums";
import { ConfigService } from "../../services/ConfigService";
import { BotPermission } from "../../decorators/BotPermission";

@Command(tempMuteOptions)
export default class TempMuteCommand extends BaseCommand {
    @DefaultCommand(EPermission.TempMute)
    @BotPermission(PermissionsBitField.Flags.ManageRoles)
    async run(client: Client, interaction: ChatInputCommandInteraction) {
        const user = interaction.options.getUser("user", true);
        const durationString = interaction.options.getString("duration", true);
        const reason = interaction.options.getString("reason") || "No reason provided";

        const duration = DurationParser.parse(durationString);
        if (!duration) {
            await interaction.reply({ content: "Invalid duration format. Use format like 10m, 1h, 1d.", flags: [MessageFlags.Ephemeral] });
            return;
        }

        let member = interaction.guild?.members.cache.get(user.id);
        if (!member) {
            try {
                member = await interaction.guild?.members.fetch(user.id);
            } catch (e) {
                // User not in guild
            }
        }

        if (!member) {
            await interaction.reply({ content: "User not found in this guild.", flags: [MessageFlags.Ephemeral] });
            return;
        }

        if (!member.moderatable) {
            await interaction.reply({ content: "I cannot mute this user.", flags: [MessageFlags.Ephemeral] });
            return;
        }

        const muteRoleId = await ConfigService.get("mute_role_id");

        if (!muteRoleId) {
            await interaction.reply({ content: "Mute role is not configured. Please ask an administrator to configure it using `/config mute-role set`.", flags: [MessageFlags.Ephemeral] });
            return;
        }

        const muteRole = interaction.guild?.roles.cache.get(muteRoleId);
        if (!muteRole) {
            await interaction.reply({ content: "Configured mute role not found in this guild.", flags: [MessageFlags.Ephemeral] });
            return;
        }

        try {
            try {
                await user.send(`You have been temporarily muted in ${interaction.guild?.name} for ${durationString}. Reason: ${reason}`);
            } catch (e) {
                // Could not send DM
            }

            await member.roles.add(muteRole);

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
                    type: SanctionType.MUTE,
                    reason: reason,
                    expiresAt: new Date(Date.now() + duration),
                },
            });

            await interaction.reply(`User ${user.tag} has been muted for ${durationString}. Reason: ${reason}`);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "An error occurred while muting the user.", flags: [MessageFlags.Ephemeral] });
        }
    }
}
