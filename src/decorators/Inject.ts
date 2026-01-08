import "reflect-metadata";

import { INJECT_METADATA_KEY, type ProviderToken } from "@di/types";

export function Inject(token: ProviderToken): ParameterDecorator {
	return (target, _propertyKey, parameterIndex) => {
		const existingTokens =
			(Reflect.getMetadata(INJECT_METADATA_KEY, target) as
				| ProviderToken[]
				| undefined) ?? [];
		existingTokens[parameterIndex] = token;
		Reflect.defineMetadata(INJECT_METADATA_KEY, existingTokens, target);
	};
}
