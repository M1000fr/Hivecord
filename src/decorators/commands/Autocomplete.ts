import { type ICommandClass } from "@interfaces/ICommandClass.ts";

export interface AutocompleteOptions {
	optionName: string;
}

export function Autocomplete(options: AutocompleteOptions): MethodDecorator {
	return (
		target: object,
		propertyKey: string | symbol,
		_descriptor: PropertyDescriptor,
	) => {
		const constructor = target.constructor as ICommandClass;
		if (!constructor.autocompletes) {
			constructor.autocompletes = new Map();
		}
		constructor.autocompletes.set(
			options.optionName,
			propertyKey as string,
		);
	};
}
