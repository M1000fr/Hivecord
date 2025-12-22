import type { IContextMenuCommandClass } from "@interfaces/IContextMenuCommandClass";

export interface UserCommandOptions {
	name: string;
	defaultMemberPermissions?: string;
}

export function UserCommand(options: UserCommandOptions) {
	return function (target: unknown) {
		const commandClass = target as IContextMenuCommandClass;
		commandClass.contextMenuOptions = {
			...options,
			type: "user",
		};
	};
}
