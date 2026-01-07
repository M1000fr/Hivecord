import { HivecordClient } from "@class/HivecordClient";
import { CommandParamType, registerCommandParameter } from "./index";

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
				return HivecordClient.getInstance();
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
