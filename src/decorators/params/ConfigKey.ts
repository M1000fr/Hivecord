import { CommandParamType, registerCommandParameter } from "./index";

export function ConfigKey(): ParameterDecorator {
	return (
		target: object,
		propertyKey: string | symbol | undefined,
		parameterIndex: number,
	) => {
		registerCommandParameter(
			target,
			propertyKey,
			parameterIndex,
			CommandParamType.ConfigKey,
		);
	};
}
