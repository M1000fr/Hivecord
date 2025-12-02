import type { CommandOptions } from "@interfaces/CommandOptions";
import { ApplicationCommandOptionType } from "discord.js";

export const clearOptions: CommandOptions = {
	name: "clear",
	description: "Clear messages in a channel",
	options: [
		{
			name: "amount",
			type: ApplicationCommandOptionType.String,
			description: "Number of messages to clear",
			required: true,
		},
		{
			name: "user",
			type: ApplicationCommandOptionType.User,
			description: "User whose messages to clear",
			required: false,
		},
	],
};
