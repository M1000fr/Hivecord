import { CommandParamType, registerCommandParameter } from "./index";

export function TargetUser(): ParameterDecorator {
	return (target, propertyKey, parameterIndex) => {
		registerCommandParameter(
			target,
			propertyKey,
			parameterIndex,
			CommandParamType.TargetUser,
		);
	};
}
