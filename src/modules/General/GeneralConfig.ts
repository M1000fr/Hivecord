import { ApplicationCommandOptionType } from "discord.js";
import { ConfigProperty, toConfigKey } from "../../decorators/ConfigProperty";

export class GeneralConfig {
    @ConfigProperty({
        displayName: "Welcome Image Text",
        description: "The text to display on the welcome image",
        type: ApplicationCommandOptionType.String,
    })
    welcomeMessageImage: string = "";

    @ConfigProperty({
        displayName: "Welcome Message",
        description: "The welcome message text",
        type: ApplicationCommandOptionType.String,
    })
    welcomeMessage: string = "";

    @ConfigProperty({
        displayName: "Welcome Channel",
        description: "The channel to send welcome messages to",
        type: ApplicationCommandOptionType.Channel,
    })
    welcomeChannelId: string = "";
}

export const GeneralConfigKeys = {
    get welcomeMessageImage() { return toConfigKey('welcomeMessageImage'); },
    get welcomeMessage() { return toConfigKey('welcomeMessage'); },
    get welcomeChannelId() { return toConfigKey('welcomeChannelId'); },
} as const;
