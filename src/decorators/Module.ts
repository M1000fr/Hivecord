import type { ModuleOptions } from "@interfaces/ModuleOptions";

export function Module(options: ModuleOptions) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return function <T extends { new (...args: any[]): object }>(
		constructor: T,
	) {
		// Validation: @Module ne peut être utilisé que sur des classes (pas sur des méthodes)
		if (typeof constructor !== "function") {
			throw new Error(`@Module decorator can only be used on classes.`);
		}
		return class extends constructor {
			public moduleOptions = options;
		};
	};
}
