import { Injectable } from "@decorators/Injectable";
import type { InjectableOptions } from "@di/types";

export function Service(options?: InjectableOptions): ClassDecorator {
	return Injectable(options);
}
