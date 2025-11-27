import type {
	ApplicationCommandOptionData,
	PermissionResolvable,
} from "discord.js";

export interface CommandOptions {
	name: string;
	description: string;
	permission?: string;
	options?: ApplicationCommandOptionData[];
	defaultMemberPermissions?: PermissionResolvable;
	dmPermission?: boolean;
}
