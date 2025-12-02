import { EPermission } from '@enums/EPermission';
import { BaseCommand } from '@class/BaseCommand';

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
		if (!target.constructor.subcommands) {
			target.constructor.subcommands = new Map();
		}
		target.constructor.subcommands.set(
			options.group ? `${options.group}:${options.name}` : options.name,
			{
				method: propertyKey,
				permission: options.permission,
			},
		);
	};
}
