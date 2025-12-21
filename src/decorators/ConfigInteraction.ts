import { Injectable } from "@decorators/Injectable";
import type { Constructor } from "@di/types";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import { ConfigHelper } from "@utils/ConfigHelper";
import "reflect-metadata";

/**
 * Decorator for configuration interaction classes that extend BaseConfigInteractions.
 * Automatically injects ConfigHelper and ConfigService, eliminating the need for
 * explicit constructors.
 */
export function ConfigInteraction(): ClassDecorator {
	return ((target: Constructor) => {
		// Apply Injectable decorator
		Injectable()(target);

		// Define explicit parameter types for dependency injection
		Reflect.defineMetadata(
			"design:paramtypes",
			[ConfigHelper, ConfigService],
			target,
		);

		return target;
	}) as ClassDecorator;
}
