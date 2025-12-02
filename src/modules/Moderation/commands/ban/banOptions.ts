import type { CommandOptions } from "@interfaces/CommandOptions";
import { ApplicationCommandOptionType } from "discord.js";

export const banOptions: CommandOptions = {
	name: "ban",
	description: "Ban a user",
	options: [
		{
			name: "user",
			description: "The user to ban",
			type: ApplicationCommandOptionType.User,
			required: true,
		},
		{
			name: "reason",
			description: "Reason for the ban",
			type: ApplicationCommandOptionType.String,
			required: false,
			autocomplete: true,
		},
		{
			name: "delete_messages",
			description: "Delete messages from the last X days (0-7)",
			type: ApplicationCommandOptionType.Integer,
			required: false,
			minValue: 0,
			maxValue: 7,
		},
	],
};
