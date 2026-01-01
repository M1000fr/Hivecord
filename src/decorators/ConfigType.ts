import "reflect-metadata";
import { PROVIDER_TYPE_METADATA_KEY } from "@di/types";
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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (target: any) => {
		// Apply Injectable decorator with global scope
		const injectableDecorator = Injectable({ scope: "global" });
		injectableDecorator(target);

		Reflect.defineMetadata(CONFIG_TYPE_METADATA_KEY, metadata, target);
		Reflect.defineMetadata(
			PROVIDER_TYPE_METADATA_KEY,
			"config-handler",
			target,
		);
	};
}
