import { CommandParamType, registerCommandParameter } from "./index";

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
