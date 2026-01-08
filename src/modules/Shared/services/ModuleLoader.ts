import path from "node:path";
import { pathToFileURL } from "node:url";
import { BaseConfigTypeHandler } from "@class/BaseConfigTypeHandler";
import { HivecordClient } from "@class/HivecordClient";
import { Injectable } from "@decorators/Injectable";
import { EVENT_METADATA_KEY } from "@decorators/On";
import {
	COMMAND_PARAMS_METADATA_KEY,
	type CommandParameter,
	CommandParamType,
} from "@decorators/params";
import { DependencyContainer } from "@di/DependencyContainer";
import {
	type Constructor,
	INJECTABLE_METADATA_KEY,
	MODULE_OPTIONS_METADATA_KEY,
	PROVIDER_TYPE_METADATA_KEY,
} from "@di/types";
import { type CommandOptions } from "@interfaces/CommandOptions.ts";
import { type ICommandClass } from "@interfaces/ICommandClass.ts";
import { type IContextMenuCommandClass } from "@interfaces/IContextMenuCommandClass.ts";
import { type IModuleInstance } from "@interfaces/IModuleInstance.ts";
import { type ModuleOptions } from "@interfaces/ModuleOptions.ts";
import { getProvidersByType } from "@utils/getProvidersByType";
import { Logger } from "@utils/Logger";
import { ApplicationCommandType } from "discord.js";

@Injectable({ scope: "global" })
export class ModuleLoader {
	private logger = new Logger("ModuleLoader");
	private container = DependencyContainer.getInstance();
	private eventListeners = new Map<
		string,
		{
			event: string;
			handler: (...args: unknown[]) => void;
			originClassName: string;
		}[]
	>();

	public async loadModules(client: HivecordClient) {
		const registeredModules = this.container.getRegisteredModules();
		const allErrors: string[] = [];

		for (const [, { options }] of registeredModules) {
			this.logger.log(`Loading module: ${options.name}`);

			// Validate all providers
			if (options.providers) {
				const providerClasses = options.providers.filter(
					(p): p is Constructor =>
						typeof p === "function" && "prototype" in p,
				);

				if (providerClasses.length > 0) {
					const errors = this.validateInjectableClasses(
						providerClasses,
						`module "${options.name}"`,
					);
					allErrors.push(...errors);
				}
			}
		}

		// If there are validation errors, display them all and stop
		if (allErrors.length > 0) {
			this.logger.error(
				`\n${"=".repeat(80)}\n` +
					`Found ${allErrors.length} missing @Injectable() decorator${allErrors.length > 1 ? "s" : ""}:\n` +
					`${"=".repeat(80)}\n`,
			);

			allErrors.forEach((error, index) => {
				this.logger.error(`${index + 1}. ${error}`);
			});

			this.logger.error(
				`\n${"=".repeat(80)}\n` +
					`All providers, commands, and event controllers must be decorated with @Injectable().\n` +
					`Please add the @Injectable() decorator to the classes listed above.\n` +
					`${"=".repeat(80)}\n`,
			);

			throw new Error(
				`Found ${allErrors.length} class${allErrors.length > 1 ? "es" : ""} missing @Injectable() decorator`,
			);
		}

		// Continue with module loading
		for (const [name, { options, moduleClass }] of registeredModules) {
			let moduleInstance: IModuleInstance | undefined;

			if (moduleClass) {
				moduleInstance = this.container.resolve(
					moduleClass as Constructor<IModuleInstance>,
					options.name,
				);
			}

			if (moduleInstance) {
				client.modules.set(name, {
					instance: moduleInstance,
					options: options,
				});
			}

			this.loadCommands(client, options);
			this.loadEvents(client, options);
			this.loadConfigHandlers(client, options);
		}

		for (const module of client.modules.values()) {
			if (typeof module.instance.setup === "function") {
				await module.instance.setup(client);
			}
		}
	}

	private loadCommands(client: HivecordClient, options: ModuleOptions): void {
		const moduleName = options.name;

		if (!options.providers) return;

		// Extract commands from providers
		const commandClasses = getProvidersByType(options.providers, "command");

		for (const CommandClass of commandClasses) {
			this.registerCommand(
				client,
				moduleName,
				CommandClass as Constructor,
			);
		}
	}

	private registerCommand(
		client: HivecordClient,
		moduleName: string,
		CommandClass: Constructor,
	) {
		// Check if it's a context menu command
		const contextMenuOptions = (
			CommandClass as unknown as IContextMenuCommandClass
		).contextMenuOptions;

		if (contextMenuOptions) {
			const instance = this.container.resolve(
				CommandClass as unknown as Constructor<object>,
				moduleName,
			);

			// Convert context menu options to Discord command format
			const commandData: CommandOptions = {
				name: contextMenuOptions.name,
				description: "",
				type:
					contextMenuOptions.type === "user"
						? ApplicationCommandType.User
						: ApplicationCommandType.Message,
				defaultMemberPermissions:
					contextMenuOptions.defaultMemberPermissions,
			} as CommandOptions & { type: ApplicationCommandType };

			client.commands.set(contextMenuOptions.name, {
				instance,
				options: commandData,
			});
			return;
		}

		// Regular slash command
		const cmdOptions = (CommandClass as unknown as ICommandClass)
			.commandOptions;
		if (!cmdOptions) return;

		const instance = this.container.resolve(
			CommandClass as unknown as Constructor<object>,
			moduleName,
		);
		client.commands.set(cmdOptions.name, {
			instance,
			options: cmdOptions,
		});
	}

	private loadConfigHandlers(
		_client: HivecordClient,
		options: ModuleOptions,
	): void {
		if (!options.providers) return;

		const handlerClasses = getProvidersByType(
			options.providers,
			"config-handler",
		);

		for (const HandlerClass of handlerClasses) {
			const instance = this.container.resolve(HandlerClass);

			if (
				instance instanceof BaseConfigTypeHandler &&
				typeof instance.registerInteractions === "function"
			) {
				instance.registerInteractions();
			}

			this.logger.log(
				`Registered config handler: ${HandlerClass.name} for module ${options.name}`,
			);
		}
	}

	private loadEvents(client: HivecordClient, options: ModuleOptions): void {
		const moduleName = options.name;

		if (!options.providers) return;

		// Extract events from providers
		const eventClasses = getProvidersByType(options.providers, "event");
		const moduleListeners = this.eventListeners.get(moduleName) ?? [];

		for (const EventClass of eventClasses) {
			this.registerEvent(
				client,
				moduleName,
				EventClass as Constructor,
				moduleListeners,
			);
		}
		this.eventListeners.set(moduleName, moduleListeners);
	}

	private registerEvent(
		client: HivecordClient,
		moduleName: string,
		EventClass: Constructor,
		moduleListeners: {
			event: string;
			handler: (...args: unknown[]) => void;
			originClassName: string;
		}[],
	) {
		const instance = this.container.resolve(
			EventClass as unknown as Constructor<object>,
			moduleName,
		);

		const prototype = Object.getPrototypeOf(instance);
		const methods = Object.getOwnPropertyNames(prototype);

		for (const methodName of methods) {
			const evtOptions = Reflect.getMetadata(
				EVENT_METADATA_KEY,
				prototype,
				methodName,
			);

			if (!evtOptions) continue;

			const handler = async (...args: unknown[]) => {
				try {
					const params: CommandParameter[] =
						Reflect.getMetadata(
							COMMAND_PARAMS_METADATA_KEY,
							prototype,
							methodName,
						) || [];

					// Sort params by index to ensure correct order
					params.sort((a, b) => a.index - b.index);

					const finalArgs: unknown[] = [];

					for (const param of params) {
						if (param.type === CommandParamType.Client) {
							finalArgs[param.index] = client;
						} else if (param.type === CommandParamType.Context) {
							finalArgs[param.index] = args;
						}
					}

					const method = (instance as Record<string, unknown>)[
						methodName
					];
					if (typeof method === "function") {
						await method.apply(instance, finalArgs);
					}
				} catch (error: unknown) {
					this.logger.error(
						`Error in event ${evtOptions.name} (method: ${methodName}):`,
						error instanceof Error ? error.stack : String(error),
					);
				}
			};

			if (evtOptions.once) {
				client.once(evtOptions.name, handler);
			} else {
				client.on(evtOptions.name, handler);
			}
			moduleListeners.push({
				event: evtOptions.name,
				handler,
				originClassName: EventClass.name,
			});
		}
	}

	public async reloadProvider(
		client: HivecordClient,
		moduleName: string,
		filePath: string,
	) {
		try {
			// Invalidate Bun's module cache
			try {
				const resolvedPath = require.resolve(filePath);
				delete require.cache[resolvedPath];

				// Attempt to clear Bun's ESM cache using the registry if available
				const bunLoader = (globalThis as any).Loader;
				if (bunLoader?.registry) {
					bunLoader.registry.delete(resolvedPath);
					bunLoader.registry.delete(filePath);
				}
			} catch {
				// Ignore if cache clearing fails
			}

			const cacheBust = `?update=${Date.now()}`;
			const fileUrl = `${pathToFileURL(filePath).href}${cacheBust}`;

			const imported = await import(fileUrl);
			const providers = Object.values(imported).filter(
				(val) => typeof val === "function" && "prototype" in val,
			) as Constructor[];

			for (const ProviderClass of providers) {
				// Check if this is a Module class
				const isModule = Reflect.hasMetadata(
					MODULE_OPTIONS_METADATA_KEY,
					ProviderClass,
				);

				if (isModule) {
					await this.reloadModule(client, ProviderClass);
					continue;
				}

				const type = Reflect.getMetadata(
					PROVIDER_TYPE_METADATA_KEY,
					ProviderClass,
				);

				// Register the new class version in the container for this module
				this.container.registerProviders([ProviderClass], {
					moduleName: moduleName,
				});

				if (type === "command") {
					const relativePath = path.relative(process.cwd(), filePath);
					this.logger.log(
						`Hot-reloaded command class ${ProviderClass.name} from ${relativePath}`,
					);
					const cmdOptions = (
						ProviderClass as unknown as ICommandClass
					).commandOptions;
					const ctxOptions = (
						ProviderClass as unknown as IContextMenuCommandClass
					).contextMenuOptions;
					const name = cmdOptions?.name ?? ctxOptions?.name;

					if (name) {
						client.commands.delete(name);
						this.registerCommand(client, moduleName, ProviderClass);
					}
				} else if (type === "event") {
					const relativePath = path.relative(process.cwd(), filePath);
					this.logger.log(
						`Hot-reloaded event class ${ProviderClass.name} from ${relativePath}`,
					);
					const moduleListeners =
						this.eventListeners.get(moduleName) ?? [];

					// Remove old listeners for this class
					const remainingListeners = moduleListeners.filter((l) => {
						if (l.originClassName === ProviderClass.name) {
							client.off(l.event, l.handler);
							return false;
						}
						return true;
					});

					// Register new ones
					this.registerEvent(
						client,
						moduleName,
						ProviderClass,
						remainingListeners,
					);
					this.eventListeners.set(moduleName, remainingListeners);
				} else if (type === "config-handler") {
					const relativePath = path.relative(process.cwd(), filePath);
					this.logger.log(
						`Hot-reloaded config handler class ${ProviderClass.name} from ${relativePath}`,
					);
					const instance = this.container.resolve(ProviderClass);

					if (
						instance instanceof BaseConfigTypeHandler &&
						typeof instance.registerInteractions === "function"
					) {
						instance.registerInteractions();
					}
				}
			}
		} catch (error) {
			this.logger.error(
				`Failed to reload provider from ${filePath}:`,
				error instanceof Error ? error.stack : String(error),
			);
		}
	}

	public async unloadModule(client: HivecordClient, moduleName: string) {
		const normalizedName = moduleName.toLowerCase();
		const module = client.modules.get(normalizedName);
		if (!module) return;

		// Unregister events
		const listeners = this.eventListeners.get(moduleName);
		if (listeners) {
			for (const { event, handler } of listeners) {
				client.off(event, handler);
			}
			this.eventListeners.delete(moduleName);
		}

		// Unregister commands
		const commandClasses = getProvidersByType(
			module.options.providers ?? [],
			"command",
		);
		for (const CommandClass of commandClasses) {
			const contextMenuOptions = (
				CommandClass as unknown as IContextMenuCommandClass
			).contextMenuOptions;
			const cmdOptions = (CommandClass as unknown as ICommandClass)
				.commandOptions;

			const name = contextMenuOptions?.name ?? cmdOptions?.name;
			if (name) {
				client.commands.delete(name);
			}
		}

		// Cleanup in container
		this.container.clearModule(moduleName);
		client.modules.delete(normalizedName);

		this.logger.log(`Module unloaded: ${moduleName}`);
	}

	public async reloadModule(
		client: HivecordClient,
		moduleClass: Constructor,
	) {
		const options =
			this.container.getModuleOptionsFromConstructor(moduleClass);
		if (!options) return;

		this.logger.log(`Reloading module: ${options.name}`);

		await this.unloadModule(client, options.name);
		this.container.registerModule(options, moduleClass);

		// Reload the specific module
		const { options: newOptions } = this.container
			.getRegisteredModules()
			.get(options.name.toLowerCase())!;

		let moduleInstance: IModuleInstance | undefined;
		if (moduleClass) {
			moduleInstance = this.container.resolve(
				moduleClass as Constructor<IModuleInstance>,
				newOptions.name,
			);
		}

		if (moduleInstance) {
			client.modules.set(newOptions.name.toLowerCase(), {
				instance: moduleInstance,
				options: newOptions,
			});
		}

		this.loadCommands(client, newOptions);
		this.loadEvents(client, newOptions);
		this.loadConfigHandlers(client, newOptions);

		if (moduleInstance && typeof moduleInstance.setup === "function") {
			await moduleInstance.setup(client);
		}

		this.logger.log(`Module ${options.name} reloaded successfully.`);
	}

	private validateInjectableClasses(
		classes: Constructor[],
		context: string,
	): string[] {
		const errors: string[] = [];

		for (const ClassConstructor of classes) {
			const isInjectable = Reflect.hasMetadata(
				INJECTABLE_METADATA_KEY,
				ClassConstructor,
			);
			if (!isInjectable) {
				errors.push(
					`Class "${ClassConstructor.name}" in ${context} is missing @Injectable() decorator.`,
				);
			}
		}

		return errors;
	}
}
