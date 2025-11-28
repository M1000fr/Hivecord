import type { CommandOptions } from "../../../../interfaces/CommandOptions";
import { ApplicationCommandOptionType } from "discord.js";

export const modulesOptions: CommandOptions = {
	name: "modules",
	description: "Configure module settings",
	options: [
		{
			name: "module",
			description: "The module to configure",
			type: ApplicationCommandOptionType.String,
			required: true,
			autocomplete: true,
		},
	],
};
