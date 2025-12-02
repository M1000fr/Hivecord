import { EPermission } from '@enums/EPermission';

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
