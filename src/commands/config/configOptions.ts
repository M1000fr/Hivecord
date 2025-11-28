import { ApplicationCommandOptionType } from "discord.js";
import type { CommandOptions } from "../../interfaces/CommandOptions";

export const configOptions: CommandOptions = {
    name: "config",
    description: "Manage bot configuration",
    options: [
        {
            name: "mute-role",
            description: "Configure the mute role",
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: "set",
                    description: "Set the mute role",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "role",
                            description: "The role to use for muting users",
                            type: ApplicationCommandOptionType.Role,
                            required: true,
                        },
                    ],
                },
                {
                    name: "get",
                    description: "Get the current mute role",
                    type: ApplicationCommandOptionType.Subcommand,
                },
            ],
        },
        {
            name: "export",
            description: "Export configuration to a JSON file",
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: "import",
            description: "Import configuration from a JSON file",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "file",
                    description: "The JSON configuration file",
                    type: ApplicationCommandOptionType.Attachment,
                    required: true,
                }
            ]
        }
    ],
};
