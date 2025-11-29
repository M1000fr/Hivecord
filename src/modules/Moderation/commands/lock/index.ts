import { ChatInputCommandInteraction, Client, PermissionsBitField, TextChannel, GuildChannel } from "discord.js";
import { BaseCommand } from "@class/BaseCommand";
import { Command } from "@decorators/Command";
import { DefaultCommand } from "@decorators/DefaultCommand";
import { EPermission } from "@enums/EPermission";
import { BotPermission } from "@decorators/BotPermission";
import { lockOptions } from "./lockOptions";

@Command(lockOptions)
export default class LockCommand extends BaseCommand {
    @DefaultCommand(EPermission.Lock)
    @BotPermission(PermissionsBitField.Flags.ManageChannels)
    async run(client: Client, interaction: ChatInputCommandInteraction) {
        const target = interaction.options.getString("target") || "channel";
        const reason = interaction.options.getString("reason") || "No reason provided";
        const guild = interaction.guild;

        if (!guild) return;

        if (target === "channel") {
            const channel = interaction.channel;
            if (!channel || !('permissionOverwrites' in channel)) {
                return interaction.reply({ content: "This channel cannot be locked.", ephemeral: true });
            }

            await (channel as TextChannel).permissionOverwrites.edit(guild.roles.everyone, {
                SendMessages: false
            }, { reason: `Lock Command: ${reason}` });

            await interaction.reply({ content: `🔒 Channel locked. Reason: ${reason}` });
        } else if (target === "server") {
            if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
                 return interaction.reply({ content: "You need Administrator permission to lock the server.", ephemeral: true });
            }

            const everyoneRole = guild.roles.everyone;
            const newPermissions = new PermissionsBitField(everyoneRole.permissions);
            newPermissions.remove(PermissionsBitField.Flags.SendMessages);

            await everyoneRole.setPermissions(newPermissions, `Server Lock Command: ${reason}`);
            await interaction.reply({ content: `🚨 **SERVER LOCKED**. Reason: ${reason}` });
        }
    }
}
