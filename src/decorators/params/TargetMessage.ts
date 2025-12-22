import { CommandParamType, registerCommandParameter } from "./index";

export function TargetMessage(): ParameterDecorator {
	return (target, propertyKey, parameterIndex) => {
		registerCommandParameter(
			target,
			propertyKey,
			parameterIndex,
			CommandParamType.TargetMessage,
		);
	};
}
