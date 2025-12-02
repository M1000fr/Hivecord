import { EPermission } from '@enums/EPermission';
import { BaseCommand } from '@class/BaseCommand';
import type { ICommandClass } from '@interfaces/ICommandClass';

export interface SubcommandOptions {
	name: string;
	group?: string;
	permission?: EPermission;
}

export function Subcommand(options: SubcommandOptions) {
	return function (
		target: any,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) {
		// Validation: @Subcommand ne peut être utilisé que sur des méthodes de classes étendant BaseCommand
		if (!(target instanceof BaseCommand)) {
			throw new Error(
				`@Subcommand decorator can only be used on methods of classes extending BaseCommand. ` +
				`Method "${propertyKey}" is in class "${target.constructor.name}" which does not extend BaseCommand.`
			);
		}
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
