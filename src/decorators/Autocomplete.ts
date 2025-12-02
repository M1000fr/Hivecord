import { BaseCommand } from '@class/BaseCommand';

export interface AutocompleteOptions {
    optionName: string;
}

export function Autocomplete(options: AutocompleteOptions) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor,
    ) {
        // Validation: @Autocomplete ne peut être utilisé que sur des méthodes de classes étendant BaseCommand
        if (!(target instanceof BaseCommand)) {
            throw new Error(
                `@Autocomplete decorator can only be used on methods of classes extending BaseCommand. ` +
                `Method "${propertyKey}" is in class "${target.constructor.name}" which does not extend BaseCommand.`
            );
        }
        if (!target.constructor.autocompletes) {
            target.constructor.autocompletes = new Map();
        }
        target.constructor.autocompletes.set(options.optionName, propertyKey);
    };
}
