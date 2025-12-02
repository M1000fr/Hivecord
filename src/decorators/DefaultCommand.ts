import { EPermission } from '@enums/EPermission';
import { BaseCommand } from '@class/BaseCommand';
import type { ICommandClass } from '@interfaces/ICommandClass';

export function DefaultCommand(permission?: EPermission) {
	return function (
		target: any,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) {
		// Validation: @DefaultCommand ne peut être utilisé que sur des méthodes de classes étendant BaseCommand
		if (!(target instanceof BaseCommand)) {
			throw new Error(
				`@DefaultCommand decorator can only be used on methods of classes extending BaseCommand. ` +
				`Method "${propertyKey}" is in class "${target.constructor.name}" which does not extend BaseCommand.`
			);
		}
		const constructor = target.constructor as ICommandClass;
		constructor.defaultCommand = propertyKey;
		if (permission) {
			constructor.defaultCommandPermission = permission;
		}
	};
}
