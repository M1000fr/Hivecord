import { BaseConfigTypeHandler } from "@class/BaseConfigTypeHandler";
import { LeBotClient } from "@class/LeBotClient";
import { Injectable } from "@decorators/Injectable";
import { EVENT_METADATA_KEY } from "@decorators/On";
import {
  COMMAND_PARAMS_METADATA_KEY,
  type CommandParameter,
  CommandParamType,
} from "@decorators/params";
import { DependencyContainer } from "@di/DependencyContainer";
import { type Constructor, INJECTABLE_METADATA_KEY } from "@di/types";
import { CommandOptions } from "@interfaces/CommandOptions.ts";
import { ICommandClass } from "@interfaces/ICommandClass.ts";
import { IContextMenuCommandClass } from "@interfaces/IContextMenuCommandClass.ts";
import { IModuleInstance } from "@interfaces/IModuleInstance.ts";
import { ModuleOptions } from "@interfaces/ModuleOptions.ts";

import { getProvidersByType } from "@utils/getProvidersByType";
import { Logger } from "@utils/Logger";
import { ApplicationCommandType } from "discord.js";

@Injectable({ scope: "global" })
export class ModuleLoader {
  private logger = new Logger("ModuleLoader");
  private container = DependencyContainer.getInstance();

  public async loadModules(client: LeBotClient) {
    const registeredModules = this.container.getRegisteredModules();
    const allErrors: string[] = [];

    for (const [, { options }] of registeredModules) {
      this.logger.log(`Loading module: ${options.name}`);

      // Validate all providers
      if (options.providers) {
        const providerClasses = options.providers.filter(
          (p): p is Constructor => typeof p === "function" && "prototype" in p,
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

  private loadCommands(client: LeBotClient, options: ModuleOptions): void {
    const moduleName = options.name;

    if (!options.providers) return;

    // Extract commands from providers
    const commandClasses = getProvidersByType(options.providers, "command");

    for (const CommandClass of commandClasses) {
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
          defaultMemberPermissions: contextMenuOptions.defaultMemberPermissions,
        } as CommandOptions & { type: ApplicationCommandType };

        client.commands.set(contextMenuOptions.name, {
          instance,
          options: commandData,
        });
        continue;
      }

      // Regular slash command
      const cmdOptions = (CommandClass as unknown as ICommandClass)
        .commandOptions;
      if (!cmdOptions) continue;

      const instance = this.container.resolve(
        CommandClass as unknown as Constructor<object>,
        moduleName,
      );
      client.commands.set(cmdOptions.name, {
        instance,
        options: cmdOptions,
      });
    }
  }

  private loadConfigHandlers(
    _client: LeBotClient,
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

  private loadEvents(client: LeBotClient, options: ModuleOptions): void {
    const moduleName = options.name;

    if (!options.providers) return;

    // Extract events from providers
    const eventClasses = getProvidersByType(options.providers, "event");

    for (const EventClass of eventClasses) {
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

            const method = (instance as Record<string, unknown>)[methodName];
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
      }
    }
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
