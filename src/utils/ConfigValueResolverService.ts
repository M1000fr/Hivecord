import { LeBotClient } from "@class/LeBotClient";
import {
  ConfigKeyMetadata,
  ConfigPropertyOptions,
  EConfigType,
  IConfigClass,
} from "@decorators/ConfigProperty";
import { Inject } from "@decorators/Inject";
import { Injectable } from "@decorators/Injectable";
import { Guild, Locale, User } from "discord.js";
import type { TFunction } from "i18next";
import { ConfigFormatterService } from "./ConfigFormatterService";
import { ConfigValueService } from "./ConfigValueService";

/**
 * Handles retrieval and formatting of current configuration values.
 * Combines persistence and formatting logic for display purposes.
 */
@Injectable({ scope: "global" })
export class ConfigValueResolverService {
  constructor(
    private readonly valueService: ConfigValueService,
    private readonly formatterService: ConfigFormatterService,
    @Inject(LeBotClient) private readonly _client: LeBotClient<true>,
  ) {}

  /**
   * Get the current value of a config key, formatted for display
   */
  async getCurrentValue(
    guild: Guild,
    key: string,
    type: EConfigType | string,
    t: TFunction,
    options?: ConfigPropertyOptions,
    locale?: string,
    defaultValue?: unknown,
  ): Promise<string> {
    try {
      let value = await this.valueService.fetchValue(guild, key, type);

      if (value === null || (Array.isArray(value) && value.length === 0)) {
        if (defaultValue !== undefined) {
          value = defaultValue as string | string[];
        }
      }

      const isSet =
        value !== null &&
        value !== undefined &&
        value !== "" &&
        (!Array.isArray(value) || value.length > 0);

      if (isSet) {
        return await ConfigFormatterService.formatValue(
          value as string | string[],
          type,
          t,
          options,
          locale,
          guild.id,
        );
      }

      return t("utils.config_helper.not_set");
    } catch {
      return t("utils.config_helper.not_set");
    }
  }

  /**
   * Build a module configuration embed with all properties
   */
  async buildModuleConfigEmbed(
    guild: Guild,
    moduleName: string,
    _user: User,
    t: TFunction,
    locale: string,
  ) {
    const module = this._client.modules.get(moduleName.toLowerCase());
    if (!module?.options.config) return null;

    const configProperties =
      (module.options.config as unknown as IConfigClass).configProperties || {};

    const fields = [];

    for (const [idx, [key, options]] of Object.entries(
      configProperties,
    ).entries()) {
      const opt = options;
      const language = locale || "fr";
      const displayName =
        opt.displayNameLocalizations?.[language as Locale] ||
        opt.displayName ||
        key;

      const configClass = module.options.config as unknown as Record<
        string,
        unknown
      >;
      const propertyValue = configClass[key];
      const defaultValue =
        propertyValue &&
        typeof propertyValue === "object" &&
        "__isConfigKey" in propertyValue
          ? (propertyValue as unknown as ConfigKeyMetadata).defaultValue
          : undefined;

      const description =
        opt.descriptionLocalizations?.[language as Locale] || opt.description;

      const currentValue = await this.getCurrentValue(
        guild,
        key,
        opt.type,
        t,
        opt,
        language,
        defaultValue,
      );

      fields.push({
        index: idx,
        name: displayName,
        value: currentValue,
        description: description,
        type: opt.type,
        emoji: opt.emoji,
      });
    }

    return { fields, configProperties };
  }
}
