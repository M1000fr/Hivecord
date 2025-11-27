import { ChatInputCommandInteraction, Client } from "discord.js";
import { BaseCommand } from "../class/BaseCommand";
import { SlashCommand } from "../decorators/SlashCommand";
import { EPermission } from "../enums/EPermission";

@SlashCommand({
    name: "ping",
    description: "Replies with Pong!",
    permission: EPermission.CommandsPing
})
export default class PingCommand extends BaseCommand {
    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        await interaction.reply("Pong!");
    }
}
