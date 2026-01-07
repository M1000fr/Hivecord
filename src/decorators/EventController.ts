import { Injectable } from "@decorators/Injectable";
import { PROVIDER_TYPE_METADATA_KEY } from "@di/types";
import "reflect-metadata";

export function EventController() {
	return (target: abstract new (...args: never[]) => object) => {
		// Apply @Injectable() automatically
		Injectable()(target);
		// Mark as event provider
		Reflect.defineMetadata(PROVIDER_TYPE_METADATA_KEY, "event", target);
	};
}
