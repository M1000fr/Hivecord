import type { Constructor, Provider, ProviderToken } from "@di/types";

export interface ModuleOptions {
	name: string;
	commands?: Constructor<object>[];
	events?: Constructor<object>[];
	interactions?: unknown[];
	config?: new () => object;
	providers?: Provider[];
	exports?: ProviderToken[];
	imports?: Constructor<object>[];
}
