import { EPermission } from "@enums/EPermission";
import type { ICommandClass } from "@interfaces/ICommandClass";

export interface OptionRouteOptions {
	option: string;
	value: string | number | boolean;
	permission?: EPermission;
}

export function OptionRoute(options: OptionRouteOptions) {
	return function (
		target: object,
		propertyKey: string,
		_descriptor: PropertyDescriptor,
	) {
		const constructor = target.constructor as ICommandClass;
		if (!constructor.optionRoutes) {
			constructor.optionRoutes = new Map();
		}

		// Get the map for this specific option name (e.g., "action")
		let optionMap = constructor.optionRoutes.get(options.option);
		if (!optionMap) {
			optionMap = new Map();
			constructor.optionRoutes.set(options.option, optionMap);
		}

		// Register the value -> method mapping
		optionMap.set(options.value, {
			method: propertyKey,
			permission: options.permission,
		});
	};
}
