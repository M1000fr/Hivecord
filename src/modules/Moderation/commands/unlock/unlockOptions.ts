import type { CommandOptions } from "@interfaces/CommandOptions";
import { ApplicationCommandOptionType } from "discord.js";

export const unlockOptions: CommandOptions = {
	name: "unlock",
	description: "Unlock a channel or the server",
	options: [
		{
			name: "target",
			description: "What to unlock (default: channel)",
			type: ApplicationCommandOptionType.String,
			required: false,
			choices: [
				{ name: "Channel", value: "channel" },
				{ name: "Server", value: "server" },
			],
		},
		{
			name: "reason",
			description: "Reason for the unlock",
			type: ApplicationCommandOptionType.String,
			required: false,
		},
	],
};
