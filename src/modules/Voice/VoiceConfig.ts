import { ApplicationCommandOptionType } from "discord.js";
import { ConfigProperty, toConfigKey } from '@decorators/ConfigProperty';

export class VoiceConfig {
    @ConfigProperty({
        displayName: "Temp Voice Generator",
        description: "The channel ID for the temporary voice channel generator",
        type: ApplicationCommandOptionType.Channel,
    })
    voiceTempVoiceGeneratorChannelId: string = "";
}

export const VoiceConfigKeys = {
    get tempVoiceGeneratorChannelId() { return toConfigKey('voiceTempVoiceGeneratorChannelId'); },
} as const;
