import { Injectable } from "@decorators/Injectable";
import { PROVIDER_TYPE_METADATA_KEY } from "@di/types";
import type { IContextMenuCommandClass } from "@interfaces/IContextMenuCommandClass";
import "reflect-metadata";

export interface MessageCommandOptions {
	name: string;
	defaultMemberPermissions?: string;
}

export function MessageCommand(options: MessageCommandOptions) {
	return (target: abstract new (...args: never[]) => object) => {
		// Apply @Injectable() automatically
		Injectable()(target);
		// Mark as command provider
		Reflect.defineMetadata(PROVIDER_TYPE_METADATA_KEY, "command", target);

		const commandClass = target as unknown as IContextMenuCommandClass;
		commandClass.contextMenuOptions = {
			...options,
			type: "message",
		};
	};
}
