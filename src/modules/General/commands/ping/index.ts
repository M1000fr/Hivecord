import { BaseCommand } from "@class/BaseCommand";
import { Command } from "@decorators/Command";
import { DefaultCommand } from "@decorators/DefaultCommand";
import { EPermission } from "@enums/EPermission";
import { ChatInputCommandInteraction, Client } from "discord.js";
import { pingOptions } from "./pingOptions";

@Command(pingOptions)
export default class PingCommand extends BaseCommand {
	@DefaultCommand(EPermission.Ping)
	async run(client: Client, interaction: ChatInputCommandInteraction) {
		await interaction.reply("Pong!");
	}
}
