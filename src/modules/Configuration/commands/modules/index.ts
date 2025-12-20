import { BaseCommand } from "@class/BaseCommand";
import { LeBotClient } from "@class/LeBotClient";
import { Autocomplete } from "@decorators/Autocomplete";
import { Command } from "@decorators/Command";
import { DefaultCommand } from "@decorators/DefaultCommand";
import { EPermission } from "@enums/EPermission";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import { GeneralConfig } from "@src/modules/General/GeneralConfig";
import { InteractionHelper } from "@src/utils/InteractionHelper";
import { ConfigHelper } from "@utils/ConfigHelper";
import {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Client,
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
		await InteractionHelper.defer(interaction);
		const lng = await ConfigService.of(interaction.guildId!, GeneralConfig)
			.generalLanguage;
		const t = I18nService.getFixedT(lng);
		const lebot = client as LeBotClient<true>;
		const moduleName = interaction.options.getString("module", true);

		const module = lebot.modules.get(moduleName.toLowerCase());

		if (!module) {
			await InteractionHelper.respond(interaction, {
				content: t("modules.configuration.commands.modules.not_found", {
					module: moduleName,
				}),
			});
			return;
		}

		if (!module.options.config) {
			await InteractionHelper.respond(interaction, {
				content: t("modules.configuration.commands.modules.no_config", {
					module: module.options.name,
				}),
			});
			return;
		}

		const config = await ConfigHelper.buildModuleConfigEmbed(
			lebot,
			interaction.guildId!,
			moduleName,
			interaction.user.id,
			lng,
		);

		if (!config) {
			await InteractionHelper.respond(interaction, {
				content: t(
					"modules.configuration.commands.modules.build_failed",
					{
						module: module.options.name,
					},
				),
			});
			return;
		}

		await InteractionHelper.respond(interaction, {
			embeds: [config.embed],
			components: [config.row],
		});
	}
}
