import type { IContextMenuCommandClass } from "@interfaces/IContextMenuCommandClass";

export interface MessageCommandOptions {
	name: string;
	defaultMemberPermissions?: string;
}

export function MessageCommand(options: MessageCommandOptions) {
	return function (target: unknown) {
		const commandClass = target as IContextMenuCommandClass;
		commandClass.contextMenuOptions = {
			...options,
			type: "message",
		};
	};
}
