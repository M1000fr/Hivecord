import { ApplicationCommandOptionType } from "discord.js";
import type { CommandOptions } from '@interfaces/CommandOptions';

export const unbanOptions: CommandOptions = {
	name: "unban",
	description: "Unban a user",
	options: [
		{
			name: "user",
			description: "The user to unban (ID)",
			type: ApplicationCommandOptionType.User,
			required: true,
		},
	],
};
