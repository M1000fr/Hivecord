import { Command, CommandController } from "@decorators/Command";
import { Client, GuildLanguage } from "@decorators/params/index.ts";
import { EPermission } from "@enums/EPermission";
import type { LeBotClient } from "@src/class/LeBotClient";
import { CommandInteraction } from "@src/decorators/Interaction";
import type { GuildLanguageContext } from "@src/types/GuildLanguageContext";
import { ChatInputCommandInteraction } from "discord.js";
import { pingOptions } from "./pingOptions";

@CommandController(pingOptions)
export default class PingCommand {
	@Command(EPermission.Ping)
	async default(
		@Client() client: LeBotClient,
		@GuildLanguage() lang: GuildLanguageContext,
		@CommandInteraction() interaction: ChatInputCommandInteraction,
	) {
		interaction.reply(lang.t("modules.general.commands.ping.response"));
	}
}
