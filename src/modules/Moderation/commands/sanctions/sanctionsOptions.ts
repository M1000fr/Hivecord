import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
} from "discord.js";
import type { CommandOptions } from "../../../../interfaces/CommandOptions";

export const sanctionsOptions: CommandOptions = {
	name: "sanctions",
	description: "List sanctions for a user",
	options: [
		{
			name: "user",
			description: "The user to check",
			type: ApplicationCommandOptionType.User,
			required: true,
		},
	],
};
