import type { PermissionResolvable } from "discord.js";

export interface ContextMenuOptions {
	name: string;
	type: "user" | "message";
	defaultMemberPermissions?: PermissionResolvable;
}

export interface IContextMenuCommandClass {
	contextMenuOptions?: ContextMenuOptions;
	execute?: string;
	new (...args: unknown[]): object;
}
