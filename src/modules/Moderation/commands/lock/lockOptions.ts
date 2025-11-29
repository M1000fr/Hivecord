import { ApplicationCommandOptionType } from "discord.js";
import type { CommandOptions } from '@interfaces/CommandOptions';

export const lockOptions: CommandOptions = {
    name: "lock",
    description: "Lock a channel or the server",
    options: [
        {
            name: "target",
            description: "What to lock (default: channel)",
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                { name: "Channel", value: "channel" },
                { name: "Server", value: "server" }
            ]
        },
        {
            name: "reason",
            description: "Reason for the lock",
            type: ApplicationCommandOptionType.String,
            required: false
        }
    ]
};
