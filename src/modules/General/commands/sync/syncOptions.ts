import type { CommandOptions } from "@interfaces/CommandOptions";
import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";

export const syncOptions: CommandOptions = {
	name: "sync",
	description: "Synchronization actions",
	nameLocalizations: {
		fr: "synchro",
	},
	descriptionLocalizations: {
		fr: "Actions de synchronisation",
	},
	defaultMemberPermissions: PermissionFlagsBits.ManageRoles,
	options: [
		{
			name: "target",
			description: "The target to synchronize",
			nameLocalizations: {
				fr: "cible",
			},
			descriptionLocalizations: {
				fr: "La cible à synchroniser",
			},
			type: ApplicationCommandOptionType.String,
			required: true,
			autocomplete: true,
		},
	],
};
