import "reflect-metadata";

import {
	INJECT_METADATA_KEY,
	INJECTABLE_METADATA_KEY,
	MODULE_OPTIONS_METADATA_KEY,
	type ClassProvider,
	type Constructor,
	type Provider,
	type ProviderScope,
	type ProviderToken,
	type ResolvedProvider,
	type ValueProvider,
} from "@di/types";
import type { ModuleOptions } from "@interfaces/ModuleOptions.ts";

interface ProviderRegistrationContext {
	moduleName?: string;
	exports?: ProviderToken[];
}

export class DependencyContainer {
	private static instance = new DependencyContainer();
	public static isInstantiating = false;

	private globalProviders = new Map<ProviderToken, ResolvedProvider>();
	private moduleProviders = new Map<
		string,
		Map<ProviderToken, ResolvedProvider>
	>();
	private exportedProviders = new Map<ProviderToken, ResolvedProvider>();

	private globalInstances = new Map<ProviderToken, unknown>();
	private moduleInstances = new Map<string, Map<ProviderToken, unknown>>();
	private registeredModules = new Map<
		string,
		{ options: ModuleOptions; moduleClass?: Constructor }
	>();

	static getInstance(): DependencyContainer {
		return this.instance;
	}

	registerModule(options: ModuleOptions, moduleClass?: Constructor): void {
		this.registeredModules.set(options.name.toLowerCase(), {
			options,
			moduleClass,
		});

		this.registerProviders(options.providers ?? [], {
			moduleName: options.name,
			exports: options.exports,
		});

		if (moduleClass) {
			const provider: ResolvedProvider = {
				token: moduleClass,
				useClass: moduleClass,
				scope: "module",
				moduleName: options.name,
			};
			this.storeProvider(provider, options.exports);
		}

		if (options.imports) {
			for (const ImportedModule of options.imports) {
				const importedOptions =
					this.getModuleOptionsFromConstructor(ImportedModule);
				if (importedOptions) {
					this.registerModule(importedOptions, ImportedModule);
				}
			}
		}
	}

	public getModuleOptionsFromConstructor(
		target: Constructor,
	): ModuleOptions | undefined {
		return Reflect.getMetadata(MODULE_OPTIONS_METADATA_KEY, target);
	}

	public getRegisteredModules(): Map<
		string,
		{ options: ModuleOptions; moduleClass?: Constructor }
	> {
		return this.registeredModules;
	}

	registerProviders(
		providers: Provider[],
		context?: ProviderRegistrationContext,
	): void {
		for (const provider of providers) {
			const normalized = this.normalizeProvider(provider, context);
			this.storeProvider(normalized, context?.exports);
		}
	}

	resolve<T extends object>(token: Constructor<T>, moduleName?: string): T;
	resolve<T = unknown>(token: ProviderToken, moduleName?: string): T;
	resolve<T>(token: ProviderToken, moduleName?: string): T {
		const normalizedModule = moduleName?.toLowerCase();
		const existing = this.getExistingInstance(token, normalizedModule);
		if (existing !== undefined) return existing as T;

		const provider = this.findProvider(token, normalizedModule);

		if (!provider) {
			if (typeof token === "function") {
				const fallbackProvider = this.normalizeProvider(
					token as Constructor,
					{
						moduleName: normalizedModule,
					},
				);
				this.storeProvider(fallbackProvider);
				const instance = this.instantiateProvider<T>(
					fallbackProvider,
					normalizedModule,
				);
				this.saveInstance(fallbackProvider, instance, normalizedModule);
				return instance as T;
			}

			throw new Error(
				`No provider found for token '${String(token)}' in module '${
					normalizedModule ?? "<global>"
				}'.`,
			);
		}

		const instance = this.instantiateProvider<T>(
			provider,
			normalizedModule,
		);
		this.saveInstance(provider, instance, normalizedModule);
		return instance as T;
	}

	private findProvider(
		token: ProviderToken,
		moduleName?: string,
	): ResolvedProvider | undefined {
		if (moduleName) {
			const moduleProviders = this.moduleProviders.get(moduleName);
			const moduleProvider = moduleProviders?.get(token);
			if (moduleProvider) return moduleProvider;
		}

		const exported = this.exportedProviders.get(token);
		if (exported) return exported;

		const globalProvider = this.globalProviders.get(token);
		if (globalProvider) return globalProvider;

		return undefined;
	}

	private normalizeProvider(
		provider: Provider,
		context?: ProviderRegistrationContext,
	): ResolvedProvider {
		if (this.isClass(provider)) {
			return this.createClassProvider(provider, context);
		}

		if (this.isClassProvider(provider)) {
			return this.createClassProvider(
				provider.useClass,
				context,
				provider,
			);
		}

		if (this.isValueProvider(provider)) {
			const scope = this.resolveScope(provider.scope, context);
			return {
				token: provider.provide,
				useValue: provider.useValue,
				scope,
				moduleName: context?.moduleName,
			};
		}

		const scope = this.resolveScope(provider.scope, context);
		return {
			token: provider.provide,
			useFactory: provider.useFactory,
			inject: provider.inject,
			scope,
			moduleName: context?.moduleName,
		};
	}

	private createClassProvider(
		target: Constructor,
		context?: ProviderRegistrationContext,
		override?: { provide?: ProviderToken; scope?: ProviderScope },
	): ResolvedProvider {
		const injectableOptions = Reflect.getMetadata(
			INJECTABLE_METADATA_KEY,
			target,
		) as { scope?: ProviderScope } | undefined;

		const scope = this.resolveScope(
			override?.scope ?? injectableOptions?.scope,
			context,
		);

		return {
			token: (override?.provide ?? target) as ProviderToken,
			useClass: target,
			scope,
			moduleName: context?.moduleName,
		};
	}

	private resolveScope(
		scope: ProviderScope | undefined,
		context?: ProviderRegistrationContext,
	): ProviderScope {
		if (scope) return scope;
		if (!context?.moduleName) return "global";
		return "module";
	}

	private storeProvider(
		provider: ResolvedProvider,
		exports?: ProviderToken[],
	) {
		if (provider.scope === "global") {
			this.globalProviders.set(provider.token, provider);
		} else if (provider.moduleName) {
			const moduleKey = provider.moduleName.toLowerCase();
			const moduleProviders =
				this.moduleProviders.get(moduleKey) ??
				new Map<ProviderToken, ResolvedProvider>();
			moduleProviders.set(provider.token, provider);
			this.moduleProviders.set(moduleKey, moduleProviders);
		}

		if (exports?.some((token) => token === provider.token)) {
			this.exportedProviders.set(provider.token, provider);
		}
	}

	private instantiateProvider<T>(
		provider: ResolvedProvider,
		moduleName?: string,
	): T {
		if (provider.useValue !== undefined) {
			return provider.useValue as T;
		}

		if (provider.useFactory) {
			const deps = (provider.inject ?? []).map((dep) =>
				this.resolve(dep, moduleName ?? provider.moduleName),
			);
			return provider.useFactory(...deps) as T;
		}

		if (!provider.useClass) {
			throw new Error(
				`Provider '${String(provider.token)}' is missing a useClass, useValue, or useFactory definition.`,
			);
		}

		const paramTypes: unknown[] =
			Reflect.getMetadata("design:paramtypes", provider.useClass) ?? [];
		const injectTokens = Reflect.getMetadata(
			INJECT_METADATA_KEY,
			provider.useClass,
		) as ProviderToken[] | undefined;

		const dependencies = paramTypes.map((paramType, index) => {
			const overrideToken = injectTokens?.[index];
			const tokenToUse = (overrideToken ?? paramType) as ProviderToken;
			return this.resolve(tokenToUse, moduleName ?? provider.moduleName);
		});

		DependencyContainer.isInstantiating = true;
		try {
			return new provider.useClass(...dependencies) as T;
		} finally {
			DependencyContainer.isInstantiating = false;
		}
	}

	private saveInstance<T>(
		provider: ResolvedProvider,
		instance: T,
		moduleName?: string,
	) {
		if (provider.scope === "global") {
			this.globalInstances.set(provider.token, instance);
			return;
		}

		const moduleKey = (moduleName ?? provider.moduleName)?.toLowerCase();
		if (!moduleKey) return;

		const moduleInstances =
			this.moduleInstances.get(moduleKey) ??
			new Map<ProviderToken, unknown>();
		moduleInstances.set(provider.token, instance as unknown);
		this.moduleInstances.set(moduleKey, moduleInstances);
	}

	private getExistingInstance(
		token: ProviderToken,
		moduleName?: string,
	): unknown {
		const globalInstance = this.globalInstances.get(token);
		if (globalInstance !== undefined) return globalInstance;

		if (moduleName) {
			const moduleInstance = this.moduleInstances
				.get(moduleName)
				?.get(token);
			if (moduleInstance !== undefined) return moduleInstance;
		}

		return undefined;
	}

	private isClass(value: Provider): value is Constructor {
		return typeof value === "function";
	}

	private isClassProvider(value: Provider): value is ClassProvider {
		return typeof value === "object" && "useClass" in value;
	}

	private isValueProvider(value: Provider): value is ValueProvider {
		return typeof value === "object" && "useValue" in value;
	}
}
