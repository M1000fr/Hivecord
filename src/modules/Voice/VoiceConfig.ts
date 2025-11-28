import { ApplicationCommandOptionType } from "discord.js";
import { ConfigProperty } from "../../decorators/ConfigProperty";

export class VoiceConfig {
    @ConfigProperty({
        description: "The channel ID for the temporary voice channel generator",
        type: ApplicationCommandOptionType.Channel,
    })
    tempVoiceGeneratorChannelId: string = "";
}
