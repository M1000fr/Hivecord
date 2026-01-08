import type { TFunction } from "i18next";

/**
 * Context object containing guild language information.
 * Provides both the locale string and translation function.
 */
export interface GuildLanguageContext {
	/**
	 * The locale code (e.g., "en", "fr", "es")
	 */
	locale: string;

	/**
	 * Translation function for the guild's language
	 */
	t: TFunction;
}
