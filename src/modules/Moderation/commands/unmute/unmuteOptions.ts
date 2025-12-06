import type { CommandOptions } from "@interfaces/CommandOptions";
import {
	ApplicationCommandOptionType,
	InteractionContextType,
} from "discord.js";

export const unmuteOptions: CommandOptions = {
	name: "unmute",
	description: "Unmute a user",
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "user",
			description: "The user to unmute",
			type: ApplicationCommandOptionType.User,
			required: true,
		},
	],
};
