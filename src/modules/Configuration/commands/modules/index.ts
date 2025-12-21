import { LeBotClient } from "@class/LeBotClient";
import { Autocomplete } from "@decorators/Autocomplete";
import { Command, CommandController } from "@decorators/Command";
import { Injectable } from "@decorators/Injectable";
import {
	AutocompleteInteraction,
	CommandInteraction,
} from "@decorators/Interaction";
import { Client } from "@decorators/params/Client";
import { GuildLocale } from "@decorators/params/GuildLocale";
import { Translate } from "@decorators/params/Translate";
import { EPermission } from "@enums/EPermission";
import { ConfigService } from "@services/ConfigService";
import { InteractionHelper } from "@src/utils/InteractionHelper";
import { ConfigHelper } from "@utils/ConfigHelper";
import {
	ChatInputCommandInteraction,
	AutocompleteInteraction as DiscordAutocompleteInteraction,
} from "discord.js";
import type { TFunction } from "i18next";
import { modulesOptions } from "./modulesOptions";

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
		@AutocompleteInteraction() interaction: DiscordAutocompleteInteraction,
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
		@Translate() t: TFunction,
		@GuildLocale() locale: string,
	) {
		await InteractionHelper.defer(interaction);
		const lebot = client;
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

		const config = await this.configHelper.buildModuleConfigEmbed(
			lebot,
			interaction.guildId!,
			moduleName,
			interaction.user.id,
			t,
			locale,
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
