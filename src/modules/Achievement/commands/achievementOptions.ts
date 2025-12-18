import type { CommandOptions } from "@interfaces/CommandOptions";
import { AchievementCategory, AchievementType } from "@prisma/client/enums";
import { ApplicationCommandOptionType } from "discord.js";

export const achievementOptions: CommandOptions = {
	name: "achievement",
	description: "Achievement system",
	options: [
		{
			name: "list",
			description: "List all achievements",
			type: ApplicationCommandOptionType.Subcommand,
		},
		{
			name: "stats",
			description: "View your achievement stats",
			type: ApplicationCommandOptionType.Subcommand,
		},
		{
			name: "add",
			description: "Add a new achievement",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "id",
					description: "Unique ID for the achievement",
					type: ApplicationCommandOptionType.String,
					required: true,
				},
				{
					name: "name",
					description: "Name of the achievement",
					type: ApplicationCommandOptionType.String,
					required: true,
				},
				{
					name: "description",
					description: "Description of the achievement",
					type: ApplicationCommandOptionType.String,
					required: true,
				},
				{
					name: "category",
					description: "Category of the achievement",
					type: ApplicationCommandOptionType.String,
					required: true,
					choices: Object.values(AchievementCategory).map((c) => ({
						name: c,
						value: c,
					})),
				},
				{
					name: "type",
					description: "Type of the achievement",
					type: ApplicationCommandOptionType.String,
					required: true,
					choices: Object.values(AchievementType).map((t) => ({
						name: t,
						value: t,
					})),
				},
				{
					name: "threshold",
					description: "Threshold value for the achievement",
					type: ApplicationCommandOptionType.Integer,
					required: true,
				},
			],
		},
		{
			name: "delete",
			description: "Delete an achievement",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "id",
					description: "ID of the achievement to delete",
					type: ApplicationCommandOptionType.String,
					required: true,
					autocomplete: true,
				},
			],
		},
		{
			name: "edit",
			description: "Edit an achievement",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "id",
					description: "ID of the achievement to edit",
					type: ApplicationCommandOptionType.String,
					required: true,
					autocomplete: true,
				},
				{
					name: "name",
					description: "New name",
					type: ApplicationCommandOptionType.String,
					required: false,
				},
				{
					name: "description",
					description: "New description",
					type: ApplicationCommandOptionType.String,
					required: false,
				},
				{
					name: "threshold",
					description: "New threshold",
					type: ApplicationCommandOptionType.Integer,
					required: false,
				},
				{
					name: "active",
					description: "Set active status",
					type: ApplicationCommandOptionType.Boolean,
					required: false,
				},
			],
		},
	],
};
