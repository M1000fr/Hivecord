import { ConfigProperty, EConfigType } from "@decorators/ConfigProperty";

export class VoiceConfig {
	@ConfigProperty({
		displayName: "Temp Voice Generator",
		displayNameLocalizations: {
			fr: "Générateur de voix temporaire",
			"en-US": "Temp Voice Generator",
		},
		description: "The channel ID for the temporary voice channel generator",
		descriptionLocalizations: {
			fr: "L'ID du canal pour le générateur de canal vocal temporaire",
			"en-US": "The channel ID for the temporary voice channel generator",
		},
		type: EConfigType.Channel,
	})
	voiceTempVoiceGeneratorChannelId: string = "";
}
