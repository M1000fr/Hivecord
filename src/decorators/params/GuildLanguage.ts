import { CommandParamType, registerCommandParameter } from "./index";

export function GuildLanguage(): ParameterDecorator {
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
