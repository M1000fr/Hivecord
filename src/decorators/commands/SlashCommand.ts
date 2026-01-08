import { Injectable } from "@decorators/Injectable";
import { PROVIDER_TYPE_METADATA_KEY } from "@di/types";
import { type CommandOptions } from "@interfaces/CommandOptions.ts";
import { type ICommandClass } from "@interfaces/ICommandClass.ts";
import "reflect-metadata";

export function SlashCommandController(
  options: CommandOptions,
): ClassDecorator {
  return ((target: Function) => {
    // Apply @Injectable() automatically
    Injectable()(target as any);
    // Mark as command provider
    Reflect.defineMetadata(PROVIDER_TYPE_METADATA_KEY, "command", target);

    const commandClass = target as unknown as ICommandClass;
    commandClass.commandOptions = options;
  }) as ClassDecorator;
}

export interface SubcommandOptions {
  index: string;
}

export function SlashCommand(options?: SubcommandOptions): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    _descriptor: PropertyDescriptor,
  ) => {
    const constructor = target.constructor as ICommandClass;

    if (options && "index" in options) {
      if (!constructor.subcommands) {
        constructor.subcommands = new Map();
      }
      const parts = options.index.split(" ");
      const key =
        parts.length > 1 ? `${parts[0]}:${parts[1]}` : (parts[0] as string);
      constructor.subcommands.set(key, {
        method: propertyKey as string,
      });
    } else {
      constructor.defaultCommand = propertyKey as string;
    }
  };
}
