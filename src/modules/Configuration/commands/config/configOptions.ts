import type { CommandOptions } from "@interfaces/CommandOptions";
import {
	ApplicationCommandOptionType,
	InteractionContextType,
} from "discord.js";

export const configOptions: CommandOptions = {
	name: "config",
	description: "Configuration management commands",
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "backup",
			description:
				"Create an encrypted backup of all module configurations",
			type: ApplicationCommandOptionType.Subcommand,
		},
		{
			name: "restore",
			description: "Restore configurations from an encrypted backup file",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "file",
					description: "The encrypted backup file to restore",
					type: ApplicationCommandOptionType.Attachment,
					required: true,
				},
			],
		},
	],
};
