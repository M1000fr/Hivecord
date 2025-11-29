import { ApplicationCommandOptionType, type ApplicationCommandOptionData } from "discord.js";

export const warnOptions: ApplicationCommandOptionData[] = [
    {
        name: "user",
        description: "The user to warn",
        type: ApplicationCommandOptionType.User,
        required: true,
    },
    {
        name: "reason",
        description: "The reason for the warning",
        type: ApplicationCommandOptionType.String,
        required: true,
    },
];
