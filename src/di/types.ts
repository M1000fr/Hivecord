// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T = object> = new (...args: any[]) => T;

export type ProviderScope = "module" | "global";

export type ProviderToken = Constructor | string | symbol;

export interface InjectableOptions {
	scope?: ProviderScope;
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

export type Provider =
	| Constructor
	| ClassProvider
	| ValueProvider
	| FactoryProvider;

export interface ResolvedProvider {
	token: ProviderToken;
	scope: ProviderScope;
	useClass?: Constructor;
	useValue?: unknown;
	useFactory?: (...args: unknown[]) => unknown;
	inject?: ProviderToken[];
	moduleName?: string;
}

export const INJECTABLE_METADATA_KEY = "lebot:injectable:options";
export const INJECT_METADATA_KEY = "lebot:inject:tokens";
export const MODULE_OPTIONS_METADATA_KEY = "lebot:module:options";
