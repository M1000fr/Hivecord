import "reflect-metadata";

import { INJECTABLE_METADATA_KEY, type InjectableOptions } from "@di/types";

export function Injectable(options?: InjectableOptions): ClassDecorator {
	return (target) => {
		Reflect.defineMetadata(INJECTABLE_METADATA_KEY, options ?? {}, target);
	};
}
