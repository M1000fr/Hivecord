// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T = object> = new (...args: any[]) => T;

export type ProviderScope = "module" | "global" | "transient";

export type ProviderToken = Constructor | string | symbol;

export type ProviderType = "service" | "command" | "event" | "config-handler";

export interface InjectableOptions {
	scope?: ProviderScope;
	type?: ProviderType;
}

export interface BaseProvider {
	provide: ProviderToken;
	scope?: ProviderScope;
}

export interface ClassProvider extends BaseProvider {
	useClass: Constructor;
}

export interface ValueProvider extends BaseProvider {
	useValue: unknown;
}

export interface FactoryProvider extends BaseProvider {
	useFactory: (...args: unknown[]) => unknown;
	inject?: ProviderToken[];
}

export interface ExistingProvider extends BaseProvider {
	useExisting: ProviderToken;
}

export type Provider =
	| Constructor
	| ClassProvider
	| ValueProvider
	| FactoryProvider
	| ExistingProvider;

export interface ResolvedProvider {
	token: ProviderToken;
	scope: ProviderScope;
	type?: ProviderType;
	useClass?: Constructor;
	useValue?: unknown;
	useFactory?: (...args: unknown[]) => unknown;
	useExisting?: ProviderToken;
	inject?: ProviderToken[];
	moduleName?: string;
}

export const INJECTABLE_METADATA_KEY = "lebot:injectable:options";
export const INJECT_METADATA_KEY = "lebot:inject:tokens";
export const MODULE_OPTIONS_METADATA_KEY = "lebot:module:options";
export const PROVIDER_TYPE_METADATA_KEY = "lebot:provider:type";
