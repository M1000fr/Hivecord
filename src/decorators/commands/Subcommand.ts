import { type ICommandClass } from "@interfaces/ICommandClass.ts";

export interface SubcommandOptions {
  name?: string;
  group?: string;
}

export function Subcommand(options?: SubcommandOptions): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    _descriptor: PropertyDescriptor,
  ) => {
    const constructor = target.constructor as ICommandClass;
    if (!constructor.subcommands) {
      constructor.subcommands = new Map();
    }

    // Infer name from method name if not provided
    const name = options?.name ?? (propertyKey as string);
    const group = options?.group;

    constructor.subcommands.set(group ? `${group}:${name}` : name, {
      method: propertyKey as string,
    });
  };
}
