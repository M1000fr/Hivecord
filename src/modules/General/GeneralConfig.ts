import { ApplicationCommandOptionType } from "discord.js";
import { ConfigProperty, toConfigKey, EConfigType } from '@decorators/ConfigProperty';

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

    @ConfigProperty({
        displayName: "Welcome Embed",
        description: "The name of the custom embed to use for welcome messages",
        type: EConfigType.CustomEmbed,
        defaultValue: "",
    })
    generalWelcomeEmbedName: string = "";
}

export const GeneralConfigKeys = {
    get welcomeMessageImage() { return toConfigKey('generalWelcomeMessageImage'); },
    get welcomeMessage() { return toConfigKey('generalWelcomeMessage'); },
    get welcomeChannelId() { return toConfigKey('generalWelcomeChannelId'); },
    get welcomeEmbedName() { return toConfigKey('generalWelcomeEmbedName'); },
} as const;
