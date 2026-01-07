import { IGuildConfig } from "../interfaces/IGuildConfig";
import { GuildLanguageContext } from "./GuildLanguageContext";

declare module "discord.js" {
  interface Guild {
    /**
     * Access module-specific configuration for this guild.
     * All properties return a Promise of the configured value.
     *
     * @example const language = await guild.config.general.Language;
     */
    readonly config: IGuildConfig;

    /**
     * Get the translation and locale context for this guild based on its configured language.
     *
     * @example const { t, locale } = await guild.i18n();
     */
    i18n(): Promise<GuildLanguageContext>;
  }
}
