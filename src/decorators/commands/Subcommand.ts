import type { ICommandClass } from "@interfaces/ICommandClass.ts";

export interface SubcommandOptions {
	name?: string;
	group?: string;
}

export function Subcommand(options?: SubcommandOptions) {
	return (
		target: object,
		propertyKey: string,
		_descriptor: PropertyDescriptor,
	) => {
		const constructor = target.constructor as ICommandClass;
		if (!constructor.subcommands) {
			constructor.subcommands = new Map();
		}

		// Infer name from method name if not provided
		const name = options?.name ?? propertyKey;
		const group = options?.group;

		constructor.subcommands.set(group ? `${group}:${name}` : name, {
			method: propertyKey,
		});
	};
}
