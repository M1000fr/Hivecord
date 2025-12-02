import { ApplicationCommandOptionType } from "discord.js";
import type { CommandOptions } from "@interfaces/CommandOptions";

export const tempMuteOptions: CommandOptions = {
	name: "tempmute",
	description: "Temporarily mute a user",
	options: [
		{
			name: "user",
			description: "The user to mute",
			type: ApplicationCommandOptionType.User,
			required: true,
		},
		{
			name: "reason",
			description: "Reason for the mute",
			type: ApplicationCommandOptionType.String,
			required: true,
			autocomplete: true,
		},
	],
};
