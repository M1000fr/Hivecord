import type { CommandOptions } from "@interfaces/CommandOptions";
import {
	ApplicationCommandOptionType,
	InteractionContextType,
} from "discord.js";

export const unbanOptions: CommandOptions = {
	name: "unban",
	description: "Unban a user",
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "user",
			description: "The user to unban (ID)",
			type: ApplicationCommandOptionType.User,
			required: true,
		},
	],
};
