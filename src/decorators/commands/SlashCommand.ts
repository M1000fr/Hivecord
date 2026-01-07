import { Injectable } from "@decorators/Injectable";
import { PROVIDER_TYPE_METADATA_KEY } from "@di/types";
import { CommandOptions } from "@interfaces/CommandOptions.ts";
import { ICommandClass } from "@interfaces/ICommandClass.ts";
import "reflect-metadata";

export function SlashCommandController(options: CommandOptions) {
  return (target: abstract new (...args: never[]) => object) => {
    // Apply @Injectable() automatically
    Injectable()(target);
    // Mark as command provider
    Reflect.defineMetadata(PROVIDER_TYPE_METADATA_KEY, "command", target);

    const commandClass = target as unknown as ICommandClass;
    commandClass.commandOptions = options;
  };
}

export interface SubcommandOptions {
  index: string;
}

export function SlashCommand(options?: SubcommandOptions) {
  return (
    target: object,
    propertyKey: string,
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
        method: propertyKey,
      });
    } else {
      constructor.defaultCommand = propertyKey;
    }
  };
}
