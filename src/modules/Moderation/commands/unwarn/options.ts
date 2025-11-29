import { ApplicationCommandOptionType, type ApplicationCommandOptionData } from "discord.js";

export const unwarnOptions: ApplicationCommandOptionData[] = [
    {
        name: "user",
        description: "The user to unwarn",
        type: ApplicationCommandOptionType.User,
        required: true,
    },
    {
        name: "warn_id",
        description: "The ID of the warning to remove",
        type: ApplicationCommandOptionType.Integer,
        required: true,
        autocomplete: true,
    },
];
