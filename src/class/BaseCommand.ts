import { ChatInputCommandInteraction, Client } from "discord.js";

export abstract class BaseCommand {
    abstract execute(client: Client, interaction: ChatInputCommandInteraction): Promise<void>;
}
