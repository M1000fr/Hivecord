import { type Constructor, PROVIDER_TYPE_METADATA_KEY } from "@di/types";
import "reflect-metadata";
import { Injectable } from "./Injectable";

export const CONFIG_TYPE_METADATA_KEY = Symbol("config_type");

export interface ConfigTypeMetadata {
  id: string;
  name: string;
}

/**
 * Decorator to mark a class as a configuration type handler.
 * The class must extend BaseConfigTypeHandler or implement ConfigTypeHandler.
 *
 * @param metadata The configuration type metadata
 */
export function ConfigType(metadata: ConfigTypeMetadata): ClassDecorator {
  return (target: object) => {
    const ctor = target as Constructor;
    // Apply Injectable decorator with global scope
    const injectableDecorator = Injectable({ scope: "global" });
    injectableDecorator(ctor);

    Reflect.defineMetadata(CONFIG_TYPE_METADATA_KEY, metadata, ctor);
    Reflect.defineMetadata(PROVIDER_TYPE_METADATA_KEY, "config-handler", ctor);
  };
}
