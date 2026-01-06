import type { Constructor } from "@di/types";
import { INTERCEPTORS_METADATA_KEY } from "@di/types";
import type { IInterceptor } from "@interfaces/IInterceptor";
import "reflect-metadata";

export function UseInterceptors(...interceptors: Constructor<IInterceptor>[]) {
	return (
		target: object | (abstract new (...args: never[]) => object),
		propertyKey?: string,
		_descriptor?: PropertyDescriptor,
	) => {
		if (propertyKey) {
			// Method decorator
			Reflect.defineMetadata(
				INTERCEPTORS_METADATA_KEY,
				interceptors,
				target,
				propertyKey,
			);
		} else {
			// Class decorator
			Reflect.defineMetadata(
				INTERCEPTORS_METADATA_KEY,
				interceptors,
				target,
			);
		}
	};
}
