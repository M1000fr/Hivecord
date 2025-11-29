import {
	ChatInputCommandInteraction,
	Client,
	MessageFlags,
} from "discord.js";
import { BaseCommand } from '@class/BaseCommand';
import { Command } from '@decorators/Command';
import { DefaultCommand } from '@decorators/DefaultCommand';
import { EPermission } from '@enums/EPermission';
import { modulesOptions } from "./modulesOptions";
import { LeBotClient } from '@class/LeBotClient';
import { ConfigHelper } from '@utils/ConfigHelper';

@Command(modulesOptions)
export default class ModulesCommand extends BaseCommand {
	@DefaultCommand(EPermission.ConfigureModules)
	async run(client: Client, interaction: ChatInputCommandInteraction) {
		const lebot = client as LeBotClient<true>;
		const moduleName = interaction.options.getString("module", true);

		const module = lebot.modules.get(moduleName.toLowerCase());

		if (!module) {
			await interaction.reply({
				content: `Module **${moduleName}** not found.`,
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		if (!module.options.config) {
			await interaction.reply({
				content: `Module **${module.options.name}** has no configuration options.`,
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		const config = await ConfigHelper.buildModuleConfigEmbed(lebot, moduleName);

		if (!config) {
			await interaction.reply({
				content: `Failed to build configuration for module **${module.options.name}**.`,
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		await interaction.reply({
			embeds: [config.embed],
			components: [config.row],
		});
	}
}
