import { ApplicationCommandOptionType } from "discord.js";
import type { CommandOptions } from "../../interfaces/CommandOptions";

export const syncOptions: CommandOptions = {
	name: "sync",
	description: "Manage database synchronization and backups",
	options: [
		{
			name: "backup",
			description: "Create a backup of the database",
			type: ApplicationCommandOptionType.Subcommand,
		},
		{
			name: "restore",
			description: "Restore the database from a backup file",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "file",
					description: "The backup file to restore",
					type: ApplicationCommandOptionType.Attachment,
					required: true,
				},
			],
		},
	],
};
