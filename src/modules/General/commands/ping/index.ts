import { Command, CommandController } from "@decorators/Command";
import { Client, GuildLanguage } from "@decorators/params/index.ts";
import { EPermission } from "@enums/EPermission";
import type { LeBotClient } from "@src/class/LeBotClient";
import { CommandInteraction } from "@src/decorators/Interaction";
import { ChatInputCommandInteraction } from "discord.js";
import type { TFunction } from "i18next";
import { pingOptions } from "./pingOptions";

@CommandController(pingOptions)
export default class PingCommand {
	@Command(EPermission.Ping)
	async default(
		@Client() client: LeBotClient,
		@GuildLanguage() locale: TFunction,
		@CommandInteraction() interaction: ChatInputCommandInteraction,
	) {
		interaction.reply(locale("modules.general.commands.ping.response"));
	}
}
