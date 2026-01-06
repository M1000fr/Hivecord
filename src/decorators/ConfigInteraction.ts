import { Injectable } from "@decorators/Injectable";
import type { Constructor } from "@di/types";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import { ConfigValueService } from "@utils/ConfigValueService";
import { ConfigUIBuilderService } from "@utils/ConfigUIBuilderService";
import { ConfigValueResolverService } from "@utils/ConfigValueResolverService";
import "reflect-metadata";

/**
 * Decorator for configuration interaction classes that extend BaseConfigInteractions.
 * Automatically injects required services for configuration management.
 */
export function ConfigInteraction(): ClassDecorator {
	return ((target: Constructor) => {
		// Apply Injectable decorator
		Injectable()(target);

		// Define explicit parameter types for dependency injection
		Reflect.defineMetadata(
			"design:paramtypes",
			[
				ConfigValueService,
				ConfigUIBuilderService,
				ConfigValueResolverService,
				ConfigService,
			],
			target,
		);

		return target;
	}) as ClassDecorator;
}
