import {
	ChatInputCommandInteraction,
	Client,
	MessageFlags,
    AutocompleteInteraction
} from "discord.js";
import { BaseCommand } from '@class/BaseCommand';
import { Command } from '@decorators/Command';
import { DefaultCommand } from '@decorators/DefaultCommand';
import { Autocomplete } from '@decorators/Autocomplete';
import { EPermission } from '@enums/EPermission';
import { modulesOptions } from "./modulesOptions";
import { LeBotClient } from '@class/LeBotClient';
import { ConfigHelper } from '@utils/ConfigHelper';

@Command(modulesOptions)
export default class ModulesCommand extends BaseCommand {
    @Autocomplete({ optionName: "module" })
    async autocompleteModule(client: LeBotClient<true>, interaction: AutocompleteInteraction) {
        const focusedValue = interaction.options.getFocused().toLowerCase();

        const modules = Array.from(client.modules.values())
            .filter((m) => m.options.config) // Only show modules with config
            .filter((m) =>
                m.options.name.toLowerCase().includes(focusedValue),
            )
            .map((m) => ({
                name: m.options.name,
                value: m.options.name.toLowerCase(),
            }))
            .slice(0, 25); // Discord limit

        await interaction.respond(modules);
    }

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

		const config = await ConfigHelper.buildModuleConfigEmbed(lebot, moduleName, interaction.user.id);

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
