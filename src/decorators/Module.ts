import type { IModuleConfigClass } from "@decorators/ModuleConfig";
import type { ModuleOptions } from "@interfaces/ModuleOptions";

export function Module(options: ModuleOptions) {
	if (options.config) {
		const configClass = options.config as unknown as IModuleConfigClass;
		if (!configClass.isModuleConfig) {
			throw new Error(
				`The configuration class ${options.config.name} in module ${options.name} must be decorated with @ModuleConfig().`,
			);
		}
	}

	return function <T extends { new (): object }>(constructor: T) {
		if (typeof constructor !== "function") {
			throw new Error(`@Module decorator can only be used on classes.`);
		}
		// @ts-expect-error: Mixin requires any[] constructor
		return class extends constructor {
			public moduleOptions = options;
		};
	};
}
