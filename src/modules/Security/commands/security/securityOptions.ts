import { ApplicationCommandOptionType } from "discord.js";
import type { CommandOptions } from '@interfaces/CommandOptions';

export const securityOptions: CommandOptions = {
    name: "security",
    description: "Security module commands",
    options: [
        {
            name: "heatpoint",
            description: "Heatpoint commands",
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: "user",
                    description: "Get heatpoints for a user",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "user",
                            description: "The user to check",
                            type: ApplicationCommandOptionType.User,
                            required: true
                        }
                    ]
                }
            ]
        }
    ]
};
