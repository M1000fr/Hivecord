import { ApplicationCommandOptionType } from "discord.js";
import { ConfigProperty, toConfigKey } from '@decorators/ConfigProperty';

export class GeneralConfig {
    @ConfigProperty({
        displayName: "Welcome Image Text",
        description: "The text to display on the welcome image",
        type: ApplicationCommandOptionType.String,
        defaultValue: "Welcome!",
    })
    generalWelcomeMessageImage: string = "Welcome!";

    @ConfigProperty({
        displayName: "Welcome Message",
        description: "The welcome message text",
        type: ApplicationCommandOptionType.String,
        defaultValue: "Welcome {user} to {guild}!",
    })
    generalWelcomeMessage: string = "Welcome {user} to {guild}!";

    @ConfigProperty({
        displayName: "Welcome Channel",
        description: "The channel to send welcome messages to",
        type: ApplicationCommandOptionType.Channel,
    })
    generalWelcomeChannelId: string = "";
}

export const GeneralConfigKeys = {
    get welcomeMessageImage() { return toConfigKey('generalWelcomeMessageImage'); },
    get welcomeMessage() { return toConfigKey('generalWelcomeMessage'); },
    get welcomeChannelId() { return toConfigKey('generalWelcomeChannelId'); },
} as const;
