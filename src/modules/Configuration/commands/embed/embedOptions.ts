import type { CommandOptions } from "@interfaces/CommandOptions";
import {
	ApplicationCommandOptionType,
	InteractionContextType,
} from "discord.js";

export const embedOptions: CommandOptions = {
	name: "embed",
	description: "Manage custom embeds",
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "builder",
			description: "Open the interactive embed builder",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "name",
					description: "The name of the embed to create or edit",
					type: ApplicationCommandOptionType.String,
					required: true,
				},
			],
		},
		{
			name: "edit",
			description: "Edit an existing embed",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "name",
					description: "The name of the embed to edit",
					type: ApplicationCommandOptionType.String,
					required: true,
					autocomplete: true,
				},
			],
		},
		{
			name: "delete",
			description: "Delete an embed",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "name",
					description: "The name of the embed to delete",
					type: ApplicationCommandOptionType.String,
					required: true,
					autocomplete: true,
				},
			],
		},
		{
			name: "list",
			description: "List all embeds",
			type: ApplicationCommandOptionType.Subcommand,
		},
		{
			name: "preview",
			description: "Preview an embed with dummy context",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "name",
					description: "The name of the embed to preview",
					type: ApplicationCommandOptionType.String,
					required: true,
					autocomplete: true,
				},
			],
		},
	],
};
