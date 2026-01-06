import "reflect-metadata";

import { INJECTABLE_METADATA_KEY, type InjectableOptions } from "@di/types";

export function Injectable(options?: InjectableOptions): ClassDecorator {
	return (target) => {
		Reflect.defineMetadata(INJECTABLE_METADATA_KEY, options ?? {}, target);

		// Ensure design:paramtypes metadata exists even if there are no constructor arguments.
		// This helps the dependency container identify classes intended for injection.
		if (!Reflect.hasMetadata("design:paramtypes", target)) {
			Reflect.defineMetadata("design:paramtypes", [], target);
		}

		return target;
	};
}
