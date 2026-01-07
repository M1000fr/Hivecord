import { LeBotClient } from "@class/LeBotClient";
import { EConfigType, type IConfigClass } from "@decorators/ConfigProperty";
import { Inject } from "@decorators/Inject";
import { Injectable } from "@decorators/Injectable";
import {
  ActionRowBuilder,
  EmbedBuilder,
  type Guild,
  type Locale,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  type User,
} from "discord.js";
import type { TFunction } from "i18next";
import { ConfigFormatterService } from "./ConfigFormatterService";
import { ConfigValueResolverService } from "./ConfigValueResolverService";
import { CustomIdHelper } from "./CustomIdHelper";

/**
 * Handles building UI components (embeds, select menus) for configuration display.
 * Constructs complex Discord components from configuration metadata.
 */
@Injectable({ scope: "global" })
export class ConfigUIBuilderService {
  constructor(
    private readonly resolver: ConfigValueResolverService,
    @Inject(LeBotClient) private readonly _client: LeBotClient<true>,
  ) {}

  /**
   * Build a configuration display embed with select menu
   */
  async buildModuleConfigEmbed(
    guild: Guild,
    moduleName: string,
    user: User,
    t: TFunction,
    locale: string,
  ) {
    const module = this._client.modules.get(moduleName.toLowerCase());
    if (!module?.options.config) return null;

    const configProperties =
      (module.options.config as unknown as IConfigClass).configProperties || {};

    const embed = new EmbedBuilder()
      .setTitle(
        t("utils.config_helper.title", {
          module: module.options.name,
        }),
      )
      .setDescription(
        t("utils.config_helper.description", {
          module: module.options.name,
        }),
      )
      .setColor("#5865F2")
      .setTimestamp();

    const resolvedData = (await this.resolver.buildModuleConfigEmbed(
      guild,
      moduleName,
      user,
      t,
      locale,
    )) || { fields: [], configProperties };

    for (const [idx, field] of resolvedData.fields.entries()) {
      embed.addFields({
        name: `${field.emoji ? `${field.emoji} ` : ""}${idx + 1}. ${field.name}`,
        value: `${field.description}\n${t("common.type")}: \`${ConfigFormatterService.getTypeName(field.type as EConfigType, t)}\`\n${t("common.current")}: ${field.value}`,
        inline: true,
      });
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(
        CustomIdHelper.build([
          "module_config",
          moduleName.toLowerCase(),
          user.id,
        ]),
      )
      .setPlaceholder(t("utils.config_helper.select_placeholder"))
      .addOptions(
        Object.entries(configProperties).map(([key, options], idx) => {
          const opt = options;
          const language = locale || "fr";
          const displayName =
            opt.displayNameLocalizations?.[language as Locale] ||
            opt.displayName ||
            key;
          const description =
            opt.descriptionLocalizations?.[language as Locale] ||
            opt.description;

          const optionBuilder = new StringSelectMenuOptionBuilder()
            .setLabel(`${idx + 1}. ${displayName}`)
            .setDescription(ConfigFormatterService.truncate(description, 100))
            .setValue(key);

          if (opt.emoji) {
            optionBuilder.setEmoji(opt.emoji);
          }

          return optionBuilder;
        }),
      );

    return {
      embed,
      row: new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        selectMenu,
      ),
    };
  }
}
