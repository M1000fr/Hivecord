import en from "@src/locales/en.json";
import fr from "@src/locales/fr.json";
import i18next from "i18next";

export type { TFunction } from "i18next";

export class I18nService {
	static async init() {
		await i18next.init({
			lng: "en", // Default language
			fallbackLng: "en",
			resources: {
				en: { translation: en },
				fr: { translation: fr },
			},
			interpolation: {
				escapeValue: false, // Discord handles escaping
			},
		});
	}

	/**
	 * Translate a key
	 * @param key The key to translate
	 * @param options Options for translation (interpolation, locale, etc.)
	 */
	static t(key: string, options?: Record<string, unknown>): string {
		return i18next.t(key, options) as string;
	}

	/**
	 * Get a fixed translation function for a specific locale
	 * @param locale The locale to use (e.g. 'en', 'fr')
	 */
	static getFixedT(locale: string) {
		return i18next.getFixedT(locale);
	}
}
