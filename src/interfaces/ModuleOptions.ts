import type { Constructor, Provider, ProviderToken } from "@di/types";

export type ModuleType = "application" | "bot";

export interface ModuleOptions {
	name: string;
	type?: ModuleType;
	global?: boolean;
	commands?: Constructor<object>[];
	events?: Constructor<object>[];
	interactions?: unknown[];
	config?: new () => object;
	providers?: Provider[];
	exports?: ProviderToken[];
	imports?: Constructor<object>[];
}
