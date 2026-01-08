import { GLOBAL_MODULE_METADATA_KEY } from "@di/types";
import "reflect-metadata";

/**
 * Decorator that marks a module as global.
 * When a module is global, its exported providers are available
 * in all other modules without the need to import the global module.
 */
export function Global(): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(GLOBAL_MODULE_METADATA_KEY, true, target);
  };
}
