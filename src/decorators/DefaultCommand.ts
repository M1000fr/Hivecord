import { EPermission } from '@enums/EPermission';
import { BaseCommand } from '@class/BaseCommand';

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
		target.constructor.defaultCommand = propertyKey;
		if (permission) {
			target.constructor.defaultCommandPermission = permission;
		}
	};
}
