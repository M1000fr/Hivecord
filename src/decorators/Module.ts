import type { ModuleOptions } from '@interfaces/ModuleOptions';

export function Module(options: ModuleOptions) {
	return function <T extends { new (...args: any[]): {} }>(constructor: T) {
		// Validation: @Module ne peut être utilisé que sur des classes (pas sur des méthodes)
		if (typeof constructor !== 'function') {
			throw new Error(
				`@Module decorator can only be used on classes.`
			);
		}
		return class extends constructor {
			public moduleOptions = options;
		};
	};
}
