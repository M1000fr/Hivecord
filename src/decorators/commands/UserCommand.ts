import { Injectable } from "@decorators/Injectable";
import type { IContextMenuCommandClass } from "@interfaces/IContextMenuCommandClass";

export interface UserCommandOptions {
	name: string;
	defaultMemberPermissions?: string;
}

export function UserCommand(options: UserCommandOptions) {
	return function (target: abstract new (...args: never[]) => object) {
		// Apply @Injectable() automatically
		Injectable()(target);
		
		const commandClass = target as unknown as IContextMenuCommandClass;
		commandClass.contextMenuOptions = {
			...options,
			type: "user",
		};
	};
}
