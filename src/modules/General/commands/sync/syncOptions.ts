import type { CommandOptions } from "@interfaces/CommandOptions";
import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";

export const syncOptions: CommandOptions = {
	name: "sync",
	description: "Synchronization actions",
	defaultMemberPermissions: PermissionFlagsBits.ManageRoles,
	options: [
		{
			name: "welcome-roles",
			description: "Synchronize welcome roles for all members",
			type: ApplicationCommandOptionType.Subcommand,
		},
	],
};
