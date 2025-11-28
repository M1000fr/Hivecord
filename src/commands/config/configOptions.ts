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
			name: "welcome-channel",
			description: "Configure the welcome channel",
			type: ApplicationCommandOptionType.SubcommandGroup,
			options: [
				{
					name: "set",
					description: "Set the welcome channel",
					type: ApplicationCommandOptionType.Subcommand,
					options: [
						{
							name: "channel",
							description:
								"The channel to send welcome messages to",
							type: ApplicationCommandOptionType.Channel,
							required: true,
						},
					],
				},
				{
					name: "get",
					description: "Get the current welcome channel",
					type: ApplicationCommandOptionType.Subcommand,
				},
			],
		},
		{
			name: "welcome-message",
			description: "Configure the welcome message text",
			type: ApplicationCommandOptionType.SubcommandGroup,
			options: [
				{
					name: "set",
					description: "Set the welcome message text",
					type: ApplicationCommandOptionType.Subcommand,
					options: [
						{
							name: "text",
							description: "The text to display. Use {user} for username.",
							type: ApplicationCommandOptionType.String,
							required: true,
						},
					],
				},
				{
					name: "get",
					description: "Get the current welcome message text",
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
				},
			],
		},
	],
};
