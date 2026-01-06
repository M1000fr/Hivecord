import { Injectable } from "@decorators/Injectable";
import { PROVIDER_TYPE_METADATA_KEY } from "@di/types";
import "reflect-metadata";

/**
 * Decorator for repository classes.
 * Repositories must be explicitly registered in a module's providers
 * and use standard constructor injection for their dependencies.
 */
export function Repository(): ClassDecorator {
	return (target) => {
		// Apply standard Injectable decorator (defaulting to module scope)
		Injectable()(target);

		// Tag the provider as a repository for identification
		Reflect.defineMetadata(
			PROVIDER_TYPE_METADATA_KEY,
			"repository",
			target,
		);

		return target;
	};
}
