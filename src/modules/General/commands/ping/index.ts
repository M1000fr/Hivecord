import { BaseCommand } from "@class/BaseCommand";
import { Command } from "@decorators/Command";
import { DefaultCommand } from "@decorators/DefaultCommand";
import { EPermission } from "@enums/EPermission";
import { GeneralConfigKeys } from "@modules/General/GeneralConfig";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import { MeasureTime } from "@src/decorators/MeasureTime";
import { ChatInputCommandInteraction, Client } from "discord.js";
import { pingOptions } from "./pingOptions";

@Command(pingOptions)
export default class PingCommand extends BaseCommand {
	@DefaultCommand(EPermission.Ping)
	@MeasureTime("ping_command_execution_time")
	async run(client: Client, interaction: ChatInputCommandInteraction) {
		const lng =
			(await ConfigService.get(GeneralConfigKeys.language)) ?? "en";
		const t = I18nService.getFixedT(lng);
		await interaction.reply(t("modules.general.commands.ping.response"));
		return true;
	}
}
