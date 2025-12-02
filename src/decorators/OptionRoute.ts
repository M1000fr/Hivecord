import { EPermission } from '@enums/EPermission';
import { BaseCommand } from '@class/BaseCommand';

export interface OptionRouteOptions {
    option: string;
    value: string | number | boolean;
    permission?: EPermission;
}

export function OptionRoute(options: OptionRouteOptions) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor,
    ) {
        // Validation: @OptionRoute ne peut être utilisé que sur des méthodes de classes étendant BaseCommand
        if (!(target instanceof BaseCommand)) {
            throw new Error(
                `@OptionRoute decorator can only be used on methods of classes extending BaseCommand. ` +
                `Method "${propertyKey}" is in class "${target.constructor.name}" which does not extend BaseCommand.`
            );
        }
        if (!target.constructor.optionRoutes) {
            target.constructor.optionRoutes = new Map();
        }

        // Get the map for this specific option name (e.g., "action")
        let optionMap = target.constructor.optionRoutes.get(options.option);
        if (!optionMap) {
            optionMap = new Map();
            target.constructor.optionRoutes.set(options.option, optionMap);
        }

        // Register the value -> method mapping
        optionMap.set(options.value, {
            method: propertyKey,
            permission: options.permission,
        });
    };
}
