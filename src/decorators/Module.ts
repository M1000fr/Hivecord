import "reflect-metadata";

import { type IModuleConfigClass } from "@decorators/ModuleConfig";
import { MODULE_OPTIONS_METADATA_KEY, type ProviderToken } from "@di/types";
import { type ModuleOptions } from "@interfaces/ModuleOptions.ts";

function ensureExportsAreDeclared(options: ModuleOptions) {
	if (options.exports && !options.providers) {
		throw new Error(
			`Module ${options.name} exports tokens but does not declare any providers.`,
		);
	}

	if (!options.exports || !options.providers) return;

	const providerTokens = new Set<ProviderToken>(
		options.providers.map((provider) => {
			if (typeof provider === "function") {
				return provider as ProviderToken;
			}

			return provider.provide as ProviderToken;
		}),
	);

	for (const token of options.exports) {
		if (!providerTokens.has(token)) {
			throw new Error(
				`The token '${String(
					token,
				)}' is exported by module ${options.name} but not provided.`,
			);
		}
	}
}

export function Module(options: ModuleOptions): ClassDecorator {
	ensureExportsAreDeclared(options);

	if (options.config) {
		const configClass = options.config as unknown as IModuleConfigClass;
		if (!configClass.isModuleConfig) {
			throw new Error(
				`The configuration class ${options.config.name} in module ${options.name} must be decorated with @ModuleConfig().`,
			);
		}
	}

	return ((constructor: Function) => {
		Reflect.defineMetadata(
			MODULE_OPTIONS_METADATA_KEY,
			options,
			constructor,
		);
		// @ts-expect-error: Mixin requires any[] constructor
		return class extends constructor {
			public moduleOptions = options;
		};
	}) as ClassDecorator;
}
