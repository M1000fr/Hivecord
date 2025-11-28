import { ApplicationCommandOptionType } from "discord.js";
import type { CommandOptions } from "../../interfaces/CommandOptions";

export const replaceRoleOptions: CommandOptions = {
	name: "replace-role",
	description: "Replace a deleted role with a new one in all groups",
	options: [
		{
			name: "old-role-id",
			description: "The ID of the role to replace",
			type: ApplicationCommandOptionType.String,
			required: true,
		},
		{
			name: "new-role",
			description: "The new role to use",
			type: ApplicationCommandOptionType.Role,
			required: true,
		},
	],
};
