import { ChatInputCommandInteraction, Client, MessageFlags, PermissionsBitField } from "discord.js";
import { BaseCommand } from "../../class/BaseCommand";
import { Command } from "../../decorators/Command";
import { DefaultCommand } from "../../decorators/DefaultCommand";
import { EPermission } from "../../enums/EPermission";
import { tempMuteOptions } from "./tempMuteOptions";
import { DurationParser } from "../../utils/DurationParser";
import { BotPermission } from "../../decorators/BotPermission";
import { SanctionService } from "../../services/SanctionService";

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

        if (!interaction.guild) return;

        try {
            await SanctionService.mute(interaction.guild, user, interaction.user, duration, durationString, reason);
            await interaction.reply(`User ${user.tag} has been muted for ${durationString}. Reason: ${reason}`);
        } catch (error: any) {
            await interaction.reply({ content: error.message || "An error occurred while muting the user.", flags: [MessageFlags.Ephemeral] });
        }
    }
}
