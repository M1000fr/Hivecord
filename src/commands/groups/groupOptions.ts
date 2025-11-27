import { ApplicationCommandOptionType } from "discord.js";
import type { CommandOptions } from "../../interfaces/CommandOptions";

export const groupOptions: CommandOptions = {
    name: "group",
    description: "Manage groups",
    options: [
        {
            name: "list",
            description: "List all groups",
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: "create",
            description: "Create a new group",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "name",
                    description: "The name of the group",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
                {
                    name: "role",
                    description: "The role associated with the group",
                    type: ApplicationCommandOptionType.Role,
                    required: true,
                },
            ],
        },
        {
            name: "update",
            description: "Update an existing group",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "id",
                    description: "The ID of the group to update",
                    type: ApplicationCommandOptionType.Integer,
                    required: true,
                },
                {
                    name: "name",
                    description: "The new name of the group",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
                {
                    name: "role",
                    description: "The new role associated with the group",
                    type: ApplicationCommandOptionType.Role,
                    required: false,
                },
            ],
        },
        {
            name: "delete",
            description: "Delete a group",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "id",
                    description: "The ID of the group to delete",
                    type: ApplicationCommandOptionType.Integer,
                    required: true,
                },
            ],
        },
    ],
};
