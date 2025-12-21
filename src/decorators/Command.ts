import { EPermission } from "@enums/EPermission";
import type { CommandOptions } from "@interfaces/CommandOptions";
import type { ICommandClass } from "@interfaces/ICommandClass";

export function CommandController(options: CommandOptions) {
	return function (target: unknown) {
		const commandClass = target as ICommandClass;
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
