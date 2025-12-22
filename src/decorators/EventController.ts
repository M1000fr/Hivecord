import { Injectable } from "@decorators/Injectable";

export function EventController() {
	return function (target: abstract new (...args: never[]) => object) {
		// Apply @Injectable() automatically
		Injectable()(target);
	};
}
