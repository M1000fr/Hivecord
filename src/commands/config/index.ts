import {
	ChatInputCommandInteraction,
	Client,
} from "discord.js";
import { BaseCommand } from "../../class/BaseCommand";
import { Pager } from "../../class/Pager";
import { Command } from "../../decorators/Command";
import { DefaultCommand } from "../../decorators/DefaultCommand";
import { EPermission } from "../../enums/EPermission";
import { configOptions } from "./configOptions";
import { CONFIG_DEFINITIONS, type ConfigDefinition } from "./configPager";

@Command(configOptions)
export default class ConfigCommand extends BaseCommand {
	@DefaultCommand(EPermission.Config)
	async run(client: Client, interaction: ChatInputCommandInteraction) {
		const pager = new Pager<ConfigDefinition>({
			items: CONFIG_DEFINITIONS,
			itemsPerPage: 5,
			type: "config_pager",
			userId: interaction.user.id,
		});

		await pager.start(interaction);
	}
}
