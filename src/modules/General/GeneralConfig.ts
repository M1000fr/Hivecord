import { ApplicationCommandOptionType } from "discord.js";
import { ConfigProperty } from "../../decorators/ConfigProperty";

export class GeneralConfig {
    @ConfigProperty({
        description: "The text to display on the welcome image",
        type: ApplicationCommandOptionType.String,
    })
    welcomeMessageImage: string = "";

    @ConfigProperty({
        description: "The welcome message text",
        type: ApplicationCommandOptionType.String,
    })
    welcomeMessage: string = "";

    @ConfigProperty({
        description: "The channel to send welcome messages to",
        type: ApplicationCommandOptionType.Channel,
    })
    welcomeChannelId: string = "";
}
