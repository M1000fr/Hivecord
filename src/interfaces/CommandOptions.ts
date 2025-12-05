import type {
	ApplicationCommandOptionData,
	LocalizationMap,
	PermissionResolvable,
} from "discord.js";

export interface CommandOptions {
	name: string;
	description: string;
	nameLocalizations?: LocalizationMap;
	descriptionLocalizations?: LocalizationMap;
	options?: ApplicationCommandOptionData[];
	defaultMemberPermissions?: PermissionResolvable;
	dmPermission?: boolean;
}
