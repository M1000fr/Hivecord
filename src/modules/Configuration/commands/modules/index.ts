import { LeBotClient } from "@class/LeBotClient";
import { Autocomplete } from "@src/decorators/commands/Autocomplete.ts";
import { Command, CommandController } from "@src/decorators/commands/Command.ts";
import { Injectable } from "@decorators/Injectable";
import {
	AutocompleteInteraction,
	CommandInteraction,
} from "@decorators/Interaction";
import { Client, GuildLanguage } from "@decorators/params/index.ts";
import { EPermission } from "@enums/EPermission";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import type { CommandAutocompleteContext } from "@src/types/CommandAutocompleteContext.ts";
import type { GuildLanguageContext } from "@src/types/GuildLanguageContext";
import { ConfigHelper } from "@utils/ConfigHelper";
import { ChatInputCommandInteraction } from "discord.js";
import { modulesOptions } from "./modulesOptions.ts";

@Injectable()
@CommandController(modulesOptions)
export default class ModulesCommand {
	constructor(
		private readonly configService: ConfigService,
		private readonly configHelper: ConfigHelper,
	) {}

	@Autocomplete({ optionName: "module" })
	async autocompleteModule(
		@Client() client: LeBotClient<true>,
		@AutocompleteInteraction() [interaction]: CommandAutocompleteContext,
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

	@Command(EPermission.ConfigureModules)
	async run(
		@Client() client: LeBotClient<true>,
		@CommandInteraction() interaction: ChatInputCommandInteraction,
		@GuildLanguage() lang: GuildLanguageContext,
	) {
		await interaction.deferReply();
		const lebot = client;
		const moduleName = interaction.options.getString("module", true);

		const module = lebot.modules.get(moduleName.toLowerCase());

		if (!module) {
			await interaction.editReply({
				content: lang.t(
					"modules.configuration.commands.modules.not_found",
					{
						module: moduleName,
					},
				),
			});
			return;
		}

		if (!module.options.config) {
			await interaction.editReply({
				content: lang.t(
					"modules.configuration.commands.modules.no_config",
					{
						module: module.options.name,
					},
				),
			});
			return;
		}

		const config = await this.configHelper.buildModuleConfigEmbed(
			lebot,
			interaction.guildId!,
			moduleName,
			interaction.user.id,
			lang.t,
			lang.locale,
		);

		if (!config) {
			await interaction.editReply({
				content: lang.t(
					"modules.configuration.commands.modules.build_failed",
					{
						module: module.options.name,
					},
				),
			});
			return;
		}

		await interaction.editReply({
			embeds: [config.embed],
			components: [config.row],
		});
	}
}
