import { COMMAND_PERMISSION_METADATA_KEY } from "@di/types";
import { EPermission } from "@enums/EPermission";
import "reflect-metadata";

export function CommandPermission(permission: EPermission) {
	return (
		target: object | (abstract new (...args: never[]) => object),
		propertyKey?: string,
		_descriptor?: PropertyDescriptor,
	) => {
		if (propertyKey) {
			// Method decorator
			Reflect.defineMetadata(
				COMMAND_PERMISSION_METADATA_KEY,
				permission,
				target,
				propertyKey,
			);
		} else {
			// Class decorator
			Reflect.defineMetadata(
				COMMAND_PERMISSION_METADATA_KEY,
				permission,
				target,
			);
		}
	};
}
