import { CommandParamType, registerCommandParameter } from "./params";

export function Translate(): ParameterDecorator {
	return (
		target: object,
		propertyKey: string | symbol | undefined,
		parameterIndex: number,
	) => {
		registerCommandParameter(
			target,
			propertyKey,
			parameterIndex,
			CommandParamType.Translate,
		);
	};
}
