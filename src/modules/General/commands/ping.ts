import {
  SlashCommand,
  SlashCommandController,
} from "@src/decorators/commands/SlashCommand";
import { CommandInteraction } from "@src/decorators/Interaction";
import type { ChatInputCommandInteraction } from "discord.js";

@SlashCommandController({
  name: "ping",
  description: "Replies with Pong!",
})
export class PingCommand {
  @SlashCommand()
  public async ping(
    @CommandInteraction() interaction: ChatInputCommandInteraction,
  ) {
    await interaction.reply("Pong!");
  }
}
