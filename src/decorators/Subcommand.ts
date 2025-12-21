import { EPermission } from "@enums/EPermission";
import type { ICommandClass } from "@interfaces/ICommandClass";

export interface SubcommandOptions {
	name: string;
	group?: string;
	permission?: EPermission;
}

export function Subcommand(options: SubcommandOptions) {
	return function (
		target: object,
		propertyKey: string,
		_descriptor: PropertyDescriptor,
	) {
		const constructor = target.constructor as ICommandClass;
		if (!constructor.subcommands) {
			constructor.subcommands = new Map();
		}
		constructor.subcommands.set(
			options.group ? `${options.group}:${options.name}` : options.name,
			{
				method: propertyKey,
				permission: options.permission,
			},
		);
	};
}
