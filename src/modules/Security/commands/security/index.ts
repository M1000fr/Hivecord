import { ChatInputCommandInteraction, Client, PermissionsBitField } from "discord.js";
import { BaseCommand } from "@class/BaseCommand";
import { Command } from "@decorators/Command";
import { DefaultCommand } from "@decorators/DefaultCommand";
import { EPermission } from "@enums/EPermission";
import { BotPermission } from "@decorators/BotPermission";
import { securityOptions } from "./securityOptions";
import { HeatpointService } from "@services/HeatpointService";

@Command(securityOptions)
export default class SecurityCommand extends BaseCommand {
    @DefaultCommand(EPermission.SecurityHeatpoint)
    @BotPermission(PermissionsBitField.Flags.ModerateMembers)
    async run(client: Client, interaction: ChatInputCommandInteraction) {
        const subcommandGroup = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();

        if (subcommandGroup === "heatpoint") {
            if (subcommand === "user") {
                const user = interaction.options.getUser("user", true);
                const heat = await HeatpointService.getHeat(`user:${user.id}`);
                
                await interaction.reply({
                    content: `🔥 **Heatpoints for ${user.tag}**: ${Math.round(heat)}`,
                    ephemeral: true
                });
            }
        }
    }
}
