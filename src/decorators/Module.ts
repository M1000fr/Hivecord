import type { ModuleOptions } from '@interfaces/ModuleOptions';

export function Module(options: ModuleOptions) {
	return function <T extends { new (...args: any[]): {} }>(constructor: T) {
		return class extends constructor {
			public moduleOptions = options;
		};
	};
}
