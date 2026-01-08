import { Injectable } from "@decorators/Injectable";
import { PROVIDER_TYPE_METADATA_KEY } from "@di/types";
import "reflect-metadata";

export function EventController(): ClassDecorator {
	return ((target: Function) => {
		// Apply @Injectable() automatically
		Injectable()(target as any);
		// Mark as event provider
		Reflect.defineMetadata(PROVIDER_TYPE_METADATA_KEY, "event", target);
	}) as ClassDecorator;
}
