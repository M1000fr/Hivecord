import { BaseCommand } from "@class/BaseCommand";
import { Command } from "@decorators/Command";
import { DefaultCommand } from "@decorators/DefaultCommand";
import { EPermission } from "@enums/EPermission";
import { ConfigService } from "@services/ConfigService";
import { MeasureTime } from "@src/decorators/MeasureTime";
import { ChatInputCommandInteraction, Client } from "discord.js";
import type { TFunction } from "i18next";
import { pingOptions } from "./pingOptions";

@Command(pingOptions)
export default class PingCommand extends BaseCommand {
	@DefaultCommand(EPermission.Ping)
	@MeasureTime({
		name: "ping_command_execution_time",
		trackInteraction: true,
		trackComponents: [ConfigService],
	})
	async run(
		client: Client,
		interaction: ChatInputCommandInteraction,
		t: TFunction<"translation", undefined>,
	) {
		await interaction.reply(t("modules.general.commands.ping.response"));

		return true;
	}
}
