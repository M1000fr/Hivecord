import { LeBotClient } from "@class/LeBotClient";
import { CommandParamType, registerCommandParameter } from "./params";

export function Client(): ParameterDecorator;
export function Client(target: object, propertyKey: string): void;
export function Client(
	target: object,
	propertyKey: string | symbol | undefined,
	parameterIndex: number,
): void;
export function Client(
	target?: object,
	propertyKey?: string | symbol,
	parameterIndex?: number,
) {
	if (target && propertyKey && parameterIndex === undefined) {
		Object.defineProperty(target, propertyKey, {
			get: () => {
				return LeBotClient.getInstance();
			},
			enumerable: true,
			configurable: true,
		});
	} else {
		return (
			target: object,
			propertyKey: string | symbol | undefined,
			parameterIndex: number,
		) => {
			registerCommandParameter(
				target!,
				propertyKey,
				parameterIndex,
				CommandParamType.Client,
			);
		};
	}
}
