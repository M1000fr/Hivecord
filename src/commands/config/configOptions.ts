import { ApplicationCommandOptionType } from "discord.js";
import type { CommandOptions } from "../../interfaces/CommandOptions";

export const configOptions: CommandOptions = {
	name: "config",
	description: "Manage bot configuration",
	options: [
		{
			name: "show",
			description: "Show current configuration",
			type: ApplicationCommandOptionType.Subcommand,
		},
		{
			name: "edit",
			description: "Edit configuration",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "mute_role",
					description: "The role to use for muting users",
					type: ApplicationCommandOptionType.Role,
					required: false,
				},
				{
					name: "welcome_channel",
					description: "The channel to send welcome messages to",
					type: ApplicationCommandOptionType.Channel,
					required: false,
				},
				{
					name: "welcome_message",
					description: "The text to display. Use {user} for username.",
					type: ApplicationCommandOptionType.String,
					required: false,
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
