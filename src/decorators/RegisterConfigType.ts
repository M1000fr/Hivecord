import {
	ConfigTypeRegistry,
	type ConfigTypeDefinition,
} from "@registers/ConfigTypeRegistry";

/**
 * Decorator to register a custom configuration type
 * Use this to create new configuration types at runtime
 *
 * @example
 * ```typescript
 * @RegisterConfigType({
 *   id: "custom_select",
 *   name: "Custom Select Menu",
 *   handler: new CustomSelectHandler()
 * })
 * export class MyConfigModule {}
 * ```
 */
export function RegisterConfigType(
	definition: ConfigTypeDefinition,
): ClassDecorator {
	return function (target: Function) {
		ConfigTypeRegistry.register(definition);
		return target;
	};
}

/**
 * Function to register a config type programmatically
 * Useful for dynamic registration outside of decorators
 *
 * @example
 * ```typescript
 * registerConfigType({
 *   id: "custom_type",
 *   name: "Custom Type",
 *   handler: myHandler
 * });
 * ```
 */
export function registerConfigType(definition: ConfigTypeDefinition): void {
	ConfigTypeRegistry.register(definition);
}
