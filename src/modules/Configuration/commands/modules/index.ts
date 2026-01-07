import { HivecordClient } from "@class/HivecordClient";
import { Injectable } from "@decorators/Injectable";
import {
  AutocompleteInteraction,
  CommandInteraction,
} from "@decorators/Interaction";
import { Client } from "@decorators/params/index.ts";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import { Autocomplete } from "@src/decorators/commands/Autocomplete.ts";
import {
  SlashCommand,
  SlashCommandController,
} from "@src/decorators/commands/SlashCommand.ts";
import type { CommandAutocompleteContext } from "@src/types/CommandAutocompleteContext.ts";

import { ConfigUIBuilderService } from "@utils/ConfigUIBuilderService";
import { ChatInputCommandInteraction } from "discord.js";
import { modulesOptions } from "./modulesOptions.ts";

@Injectable()
@SlashCommandController(modulesOptions)
export default class ModulesCommand {
  constructor(
    private readonly configService: ConfigService,
    private readonly uiBuilder: ConfigUIBuilderService,
  ) {}

  @Autocomplete({ optionName: "module" })
  async autocompleteModule(
    @Client() client: HivecordClient<true>,
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

  @SlashCommand()
  async run(
    @Client() client: HivecordClient<true>,
    @CommandInteraction() interaction: ChatInputCommandInteraction,
  ) {
    await interaction.deferReply();
    const lang = await interaction.guild?.i18n();

    if (!lang || !interaction.guild) {
      await interaction.editReply({
        content: "This command can only be used in a server.",
      });
      return;
    }

    const hivecord = client;
    const moduleName = interaction.options.getString("module", true);

    const module = hivecord.modules.get(moduleName.toLowerCase());

    if (!module) {
      await interaction.editReply({
        content: lang.t("modules.configuration.commands.modules.not_found", {
          module: moduleName,
        }),
      });
      return;
    }

    if (!module.options.config) {
      await interaction.editReply({
        content: lang.t("modules.configuration.commands.modules.no_config", {
          module: module.options.name,
        }),
      });
      return;
    }

    const config = await this.uiBuilder.buildModuleConfigEmbed(
      interaction.guild,
      moduleName,
      interaction.user,
      lang.t,
      lang.locale,
    );

    if (!config) {
      await interaction.editReply({
        content: lang.t("modules.configuration.commands.modules.build_failed", {
          module: module.options.name,
        }),
      });
      return;
    }

    await interaction.editReply({
      embeds: [config.embed],
      components: [config.row],
    });
  }
}
