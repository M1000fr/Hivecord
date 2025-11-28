import { ChatInputCommandInteraction, Client, MessageFlags, PermissionsBitField } from "discord.js";
import { BaseCommand } from "../../class/BaseCommand";
import { Command } from "../../decorators/Command";
import { DefaultCommand } from "../../decorators/DefaultCommand";
import { EPermission } from "../../enums/EPermission";
import { unmuteOptions } from "./unmuteOptions";
import { BotPermission } from "../../decorators/BotPermission";
import { SanctionService } from "../../services/SanctionService";

@Command(unmuteOptions)
export default class UnmuteCommand extends BaseCommand {
    @DefaultCommand(EPermission.Unmute)
    @BotPermission(PermissionsBitField.Flags.ManageRoles)
    async run(client: Client, interaction: ChatInputCommandInteraction) {
        const user = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("reason") || "No reason provided";

        if (!interaction.guild) return;

        try {
            await SanctionService.unmute(interaction.guild, user, reason);
            await interaction.reply(`User ${user.tag} has been unmuted. Reason: ${reason}`);
        } catch (error: any) {
            await interaction.reply({ content: error.message || "An error occurred while unmuting the user.", flags: [MessageFlags.Ephemeral] });
        }
    }
}
