import {
	ConfigProperty,
	EConfigType,
	configKey,
} from "@decorators/ConfigProperty";
import { ModuleConfig } from "@decorators/ModuleConfig";
import type { ConfigProxy } from "@modules/Configuration/services/ConfigService";

@ModuleConfig()
export class GeneralConfig {
	@ConfigProperty({
		displayName: "Bot Language",
		displayNameLocalizations: {
			fr: "Langue du bot",
		},
		description: "The global language for the bot (e.g. en, fr)",
		descriptionLocalizations: {
			fr: "La langue globale du bot (ex: en, fr)",
		},
		type: EConfigType.StringChoice,
		choices: [
			{
				name: "English",
				value: "en",
			},
			{
				name: "Français",
				value: "fr",
			},
		],
		nonNull: true,
		emoji: "🌐",
	})
	static Language = configKey("fr");
}

declare module "@interfaces/IGuildConfig" {
	interface IGuildConfig {
		general: ConfigProxy<typeof GeneralConfig>;
	}
}
