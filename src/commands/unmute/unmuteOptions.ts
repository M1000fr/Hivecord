import { ApplicationCommandOptionType } from "discord.js";
import type { CommandOptions } from "../../interfaces/CommandOptions";

export const unmuteOptions: CommandOptions = {
	name: "unmute",
	description: "Unmute a user",
	options: [
		{
			name: "user",
			description: "The user to unmute",
			type: ApplicationCommandOptionType.User,
			required: true,
		},
		{
			name: "reason",
			description: "Reason for the unmute",
			type: ApplicationCommandOptionType.String,
			required: false,
		},
	],
};
