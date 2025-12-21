import { CommandParamType, registerCommandParameter } from "./params";

export function Context(): ParameterDecorator {
	return (target, propertyKey, parameterIndex) => {
		registerCommandParameter(
			target,
			propertyKey,
			parameterIndex,
			CommandParamType.Context,
		);
	};
}
