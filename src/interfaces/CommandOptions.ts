import type {
	ApplicationCommandOptionData,
	PermissionResolvable,
} from "discord.js";
import type { EPermission } from "../enums/EPermission";

export interface CommandOptions {
	name: string;
	description: string;
	permission?: EPermission;
	options?: ApplicationCommandOptionData[];
	defaultMemberPermissions?: PermissionResolvable;
	dmPermission?: boolean;
}
