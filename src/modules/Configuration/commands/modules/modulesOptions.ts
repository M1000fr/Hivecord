import type { CommandOptions } from "@interfaces/CommandOptions.ts";
import {
	ApplicationCommandOptionType,
	InteractionContextType,
} from "discord.js";

export const modulesOptions: CommandOptions = {
	name: "modules",
	description: "Configure module settings",
	contexts: [InteractionContextType.Guild],
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
