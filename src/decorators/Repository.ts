import { Injectable } from "@decorators/Injectable";
import type { Constructor } from "@di/types";
import { PrismaService } from "@modules/Core/services/PrismaService";
import "reflect-metadata";

/**
 * Decorator for repository classes that automatically handles PrismaService injection.
 * This eliminates the need for explicit constructors in repository classes.
 */
export function Repository(): ClassDecorator {
	return ((target: Constructor) => {
		// Apply Injectable decorator
		Injectable({ scope: "global" })(target);

		// Store original constructor
		const original = target;

		// Create new constructor that auto-injects PrismaService
		const newConstructor = function (prisma: PrismaService) {
			return Reflect.construct(original, [prisma]);
		} as unknown as Constructor;

		Object.defineProperty(newConstructor, "name", { value: original.name });

		// Copy prototype and static properties
		newConstructor.prototype = original.prototype;
		Object.setPrototypeOf(newConstructor, original);

		// Copy metadata
		const metadataKeys = Reflect.getMetadataKeys(original);
		for (const key of metadataKeys) {
			const metadata = Reflect.getMetadata(key, original);
			Reflect.defineMetadata(key, metadata, newConstructor);
		}

		return newConstructor;
	}) as ClassDecorator;
}
