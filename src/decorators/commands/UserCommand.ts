import { Injectable } from "@decorators/Injectable";
import { PROVIDER_TYPE_METADATA_KEY } from "@di/types";
import { type IContextMenuCommandClass } from "@interfaces/IContextMenuCommandClass";
import type { PermissionResolvable } from "discord.js";
import "reflect-metadata";

export interface UserCommandOptions {
	name: string;
	defaultMemberPermissions?: PermissionResolvable;
}

export function UserCommand(options: UserCommandOptions): ClassDecorator {
	return ((target: Function) => {
		// Apply @Injectable() automatically
		Injectable()(target as any);
		// Mark as command provider
		Reflect.defineMetadata(PROVIDER_TYPE_METADATA_KEY, "command", target);

		const commandClass = target as unknown as IContextMenuCommandClass;
		commandClass.contextMenuOptions = {
			...options,
			type: "user",
		};
	}) as ClassDecorator;
}
