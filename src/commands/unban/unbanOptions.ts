import { ApplicationCommandOptionType } from "discord.js";
import type { CommandOptions } from "../../interfaces/CommandOptions";

export const unbanOptions: CommandOptions = {
    name: "unban",
    description: "Unban a user",
    options: [
        {
            name: "user",
            description: "The user to unban (ID)",
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: "reason",
            description: "Reason for the unban",
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],
};
