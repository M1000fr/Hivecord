import { CommandParamType, registerCommandParameter } from "./params";

export function EventParam(): ParameterDecorator {
	return (target, propertyKey, parameterIndex) => {
		registerCommandParameter(
			target,
			propertyKey,
			parameterIndex,
			CommandParamType.EventParam,
		);
	};
}
