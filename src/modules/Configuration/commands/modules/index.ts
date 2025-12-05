import { BaseCommand } from "@class/BaseCommand";
import { LeBotClient } from "@class/LeBotClient";
import { Autocomplete } from "@decorators/Autocomplete";
import { Command } from "@decorators/Command";
import { DefaultCommand } from "@decorators/DefaultCommand";
import { EPermission } from "@enums/EPermission";
import { GeneralConfigKeys } from "@modules/General/GeneralConfig";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import { ConfigHelper } from "@utils/ConfigHelper";
import {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Client,
	MessageFlags,
} from "discord.js";
import { modulesOptions } from "./modulesOptions";

@Command(modulesOptions)
export default class ModulesCommand extends BaseCommand {
	@Autocomplete({ optionName: "module" })
	async autocompleteModule(
		client: LeBotClient<true>,
		interaction: AutocompleteInteraction,
	) {
		const focusedValue = interaction.options.getFocused().toLowerCase();

		const modules = Array.from(client.modules.values())
			.filter((m) => m.options.config) // Only show modules with config
			.filter((m) => m.options.name.toLowerCase().includes(focusedValue))
			.map((m) => ({
				name: m.options.name,
				value: m.options.name.toLowerCase(),
			}))
			.slice(0, 25); // Discord limit

		await interaction.respond(modules);
	}

	@DefaultCommand(EPermission.ConfigureModules)
	async run(client: Client, interaction: ChatInputCommandInteraction) {
		const lng =
			(await ConfigService.get(GeneralConfigKeys.language)) ?? "en";
		const t = I18nService.getFixedT(lng);
		const lebot = client as LeBotClient<true>;
		const moduleName = interaction.options.getString("module", true);

		const module = lebot.modules.get(moduleName.toLowerCase());

		if (!module) {
			await interaction.reply({
				content: t("modules.configuration.commands.modules.not_found", {
					module: moduleName,
				}),
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		if (!module.options.config) {
			await interaction.reply({
				content: t("modules.configuration.commands.modules.no_config", {
					module: module.options.name,
				}),
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		const config = await ConfigHelper.buildModuleConfigEmbed(
			lebot,
			moduleName,
			interaction.user.id,
			lng,
		);

		if (!config) {
			await interaction.reply({
				content: t(
					"modules.configuration.commands.modules.build_failed",
					{
						module: module.options.name,
					},
				),
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
