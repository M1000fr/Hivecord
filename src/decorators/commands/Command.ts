import { Injectable } from "@decorators/Injectable";
import { PROVIDER_TYPE_METADATA_KEY } from "@di/types";
import { EPermission } from "@enums/EPermission";
import type { CommandOptions } from "@interfaces/CommandOptions.ts";
import type { ICommandClass } from "@interfaces/ICommandClass.ts";
import "reflect-metadata";

export function CommandController(options: CommandOptions) {
	return function (target: abstract new (...args: never[]) => object) {
		// Apply @Injectable() automatically
		Injectable()(target);
		// Mark as command provider
		Reflect.defineMetadata(PROVIDER_TYPE_METADATA_KEY, "command", target);
		
		const commandClass = target as unknown as ICommandClass;
		commandClass.commandOptions = options;
	};
}

export interface SubcommandOptions {
	index: string;
	permission?: EPermission;
}

export function Command(optionsOrPermission?: EPermission | SubcommandOptions) {
	return function (
		target: object,
		propertyKey: string,
		_descriptor: PropertyDescriptor,
	) {
		const constructor = target.constructor as ICommandClass;

		if (
			typeof optionsOrPermission === "object" &&
			"index" in optionsOrPermission
		) {
			if (!constructor.subcommands) {
				constructor.subcommands = new Map();
			}
			const parts = optionsOrPermission.index.split(" ");
			const key =
				parts.length > 1
					? `${parts[0]}:${parts[1]}`
					: (parts[0] as string);
			constructor.subcommands.set(key, {
				method: propertyKey,
				permission: optionsOrPermission.permission,
			});
		} else {
			constructor.defaultCommand = propertyKey;
			if (optionsOrPermission) {
				constructor.defaultCommandPermission =
					optionsOrPermission as EPermission;
			}
		}
	};
}
