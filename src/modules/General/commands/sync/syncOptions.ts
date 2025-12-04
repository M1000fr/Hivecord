import type { CommandOptions } from "@interfaces/CommandOptions";
import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";

export const syncOptions: CommandOptions = {
	name: "sync",
	description: "Synchronization actions",
	defaultMemberPermissions: PermissionFlagsBits.ManageRoles,
	options: [
		{
			name: "target",
			description: "The target to synchronize",
			type: ApplicationCommandOptionType.String,
			required: true,
			autocomplete: true,
		},
	],
};
