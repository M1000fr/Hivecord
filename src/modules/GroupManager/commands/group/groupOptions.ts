import type { CommandOptions } from "@interfaces/CommandOptions";
import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";

export const groupOptions: CommandOptions = {
	name: "group",
	description: "Manage groups and permissions",
	defaultMemberPermissions: PermissionFlagsBits.Administrator,
	options: [
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
			name: "delete",
			description: "Delete a group",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "name",
					description: "The name of the group",
					type: ApplicationCommandOptionType.String,
					required: true,
					autocomplete: true,
				},
			],
		},
		{
			name: "permissions",
			description: "Manage permissions for a group",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "group",
					description: "The name of the group",
					type: ApplicationCommandOptionType.String,
					required: true,
					autocomplete: true,
				},
			],
		},
		{
			name: "list",
			description: "List all groups and their permissions",
			type: ApplicationCommandOptionType.Subcommand,
		},
	],
};
