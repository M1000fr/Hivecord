import { ChatInputCommandInteraction, Client } from "discord.js";
import { BaseCommand } from "../class/BaseCommand";
import { SlashCommand } from "../decorators/SlashCommand";

@SlashCommand({
    name: "ping",
    description: "Replies with Pong!",
})
export default class PingCommand extends BaseCommand {
    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        await interaction.reply("Pong!");
    }
}
