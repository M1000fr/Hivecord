import { BaseCommand } from "@class/BaseCommand";
import { Command } from "@decorators/Command";
import { DefaultCommand } from "@decorators/DefaultCommand";
import { EPermission } from "@enums/EPermission";
import { InteractionHelper } from "@src/utils/InteractionHelper";
import { ChatInputCommandInteraction, Client } from "discord.js";
import type { TFunction } from "i18next";
import { pingOptions } from "./pingOptions";

@Command(pingOptions)
export default class PingCommand extends BaseCommand {
	@DefaultCommand(EPermission.Ping)
	async run(
		client: Client,
		interaction: ChatInputCommandInteraction,
		t: TFunction<"translation", undefined>,
	) {
		await InteractionHelper.respond(interaction, {
			content: t("modules.general.commands.ping.response"),
		});

		return true;
	}
}
