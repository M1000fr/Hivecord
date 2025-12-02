import type { CommandOptions } from "@interfaces/CommandOptions";
import { ApplicationCommandOptionType } from "discord.js";

export const sanctionsOptions: CommandOptions = {
	name: "sanctions",
	description: "Manage sanctions",
	options: [
		{
			name: "list",
			description: "List sanctions for a user",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "user",
					description: "The user to check",
					type: ApplicationCommandOptionType.User,
					required: true,
				},
			],
		},
		{
			name: "reason",
			description: "Manage sanction reasons",
			type: ApplicationCommandOptionType.SubcommandGroup,
			options: [
				{
					name: "add",
					description: "Add a new sanction reason",
					type: ApplicationCommandOptionType.Subcommand,
					options: [
						{
							name: "text",
							description: "The reason text",
							type: ApplicationCommandOptionType.String,
							required: true,
						},
						{
							name: "type",
							description: "The sanction type",
							type: ApplicationCommandOptionType.String,
							required: true,
							choices: [
								{ name: "Warn", value: "WARN" },
								{ name: "Mute", value: "MUTE" },
								{ name: "Kick", value: "KICK" },
								{ name: "Ban", value: "BAN" },
							],
						},
						{
							name: "duration",
							description: "Default duration (e.g. 1h, 30m)",
							type: ApplicationCommandOptionType.String,
							required: false,
						},
					],
				},
				{
					name: "edit",
					description: "Edit a sanction reason",
					type: ApplicationCommandOptionType.Subcommand,
					options: [
						{
							name: "id",
							description: "The ID of the reason to edit",
							type: ApplicationCommandOptionType.Integer,
							required: true,
						},
						{
							name: "text",
							description: "The new reason text",
							type: ApplicationCommandOptionType.String,
							required: false,
						},
						{
							name: "duration",
							description: "The new default duration",
							type: ApplicationCommandOptionType.String,
							required: false,
						},
					],
				},
				{
					name: "remove",
					description: "Remove a sanction reason",
					type: ApplicationCommandOptionType.Subcommand,
					options: [
						{
							name: "id",
							description: "The ID of the reason to remove",
							type: ApplicationCommandOptionType.Integer,
							required: true,
						},
					],
				},
				{
					name: "list",
					description: "List all sanction reasons",
					type: ApplicationCommandOptionType.Subcommand,
					options: [
						{
							name: "type",
							description: "Filter by sanction type",
							type: ApplicationCommandOptionType.String,
							required: false,
							choices: [
								{ name: "Warn", value: "WARN" },
								{ name: "Mute", value: "MUTE" },
								{ name: "Kick", value: "KICK" },
								{ name: "Ban", value: "BAN" },
							],
						},
					],
				},
			],
		},
	],
};
