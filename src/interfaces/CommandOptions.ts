import {
	type ApplicationCommandOptionData,
	ApplicationCommandType,
	InteractionContextType,
	type LocalizationMap,
	type PermissionResolvable,
} from "discord.js";

export interface CommandOptions {
	name: string;
	description: string;
	type?: ApplicationCommandType;
	nameLocalizations?: LocalizationMap;
	descriptionLocalizations?: LocalizationMap;
	options?: ApplicationCommandOptionData[];
	defaultMemberPermissions?: PermissionResolvable;
	contexts?: InteractionContextType[];
}
