import type { ICommandClass } from "@interfaces/ICommandClass";

export interface AutocompleteOptions {
	optionName: string;
}

export function Autocomplete(options: AutocompleteOptions) {
	return function (
		target: object,
		propertyKey: string,
		_descriptor: PropertyDescriptor,
	) {
		const constructor = target.constructor as ICommandClass;
		if (!constructor.autocompletes) {
			constructor.autocompletes = new Map();
		}
		constructor.autocompletes.set(options.optionName, propertyKey);
	};
}
