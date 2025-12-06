import type {
	ApplicationCommandOptionData,
	InteractionContextType,
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
	contexts?: InteractionContextType[];
}
