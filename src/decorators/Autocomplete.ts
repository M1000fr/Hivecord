export interface AutocompleteOptions {
    optionName: string;
}

export function Autocomplete(options: AutocompleteOptions) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor,
    ) {
        if (!target.constructor.autocompletes) {
            target.constructor.autocompletes = new Map();
        }
        target.constructor.autocompletes.set(options.optionName, propertyKey);
    };
}
