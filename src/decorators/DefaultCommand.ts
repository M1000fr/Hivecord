import { EPermission } from '@enums/EPermission';

export function DefaultCommand(permission?: EPermission) {
	return function (
		target: any,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) {
		target.constructor.defaultCommand = propertyKey;
		if (permission) {
			target.constructor.defaultCommandPermission = permission;
		}
	};
}
