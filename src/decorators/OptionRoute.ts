import { BaseCommand } from "@class/BaseCommand";
import { EPermission } from "@enums/EPermission";
import type { ICommandClass } from "@interfaces/ICommandClass";

export interface OptionRouteOptions {
	option: string;
	value: string | number | boolean;
	permission?: EPermission;
}

export function OptionRoute(options: OptionRouteOptions) {
	return function (
		target: BaseCommand,
		propertyKey: string,
		_descriptor: PropertyDescriptor,
	) {
		// Validation: @OptionRoute ne peut être utilisé que sur des méthodes de classes étendant BaseCommand
		if (!(target instanceof BaseCommand)) {
			throw new Error(
				`@OptionRoute decorator can only be used on methods of classes extending BaseCommand. ` +
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					`Method "${propertyKey}" is in class "${(target as any).constructor.name}" which does not extend BaseCommand.`,
			);
		}
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
