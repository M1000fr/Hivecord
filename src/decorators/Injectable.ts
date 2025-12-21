import "reflect-metadata";

import { DependencyContainer } from "@di/DependencyContainer";
import { INJECTABLE_METADATA_KEY, type InjectableOptions } from "@di/types";

export function Injectable(options?: InjectableOptions): ClassDecorator {
	return (target) => {
		Reflect.defineMetadata(INJECTABLE_METADATA_KEY, options ?? {}, target);

		// Create a proxy constructor to enforce DI usage
		const proxy = new Proxy(target, {
			construct(target, args) {
				if (!DependencyContainer.isInstantiating) {
					throw new Error(
						`Cannot instantiate ${target.name} directly. Use dependency injection.`,
					);
				}
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				return new (target as any)(...args);
			},
		});

		// Copy metadata from target to proxy
		const keys = Reflect.getMetadataKeys(target);
		for (const key of keys) {
			const value = Reflect.getMetadata(key, target);
			Reflect.defineMetadata(key, value, proxy);
		}

		return proxy;
	};
}
