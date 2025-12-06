import { ConfigContextVariable } from "@enums/ConfigContextVariable";

export function ConfigContext(variables: ConfigContextVariable[]) {
	return function (target: any, propertyKey: string) {
		if (!target.constructor.configContexts) {
			target.constructor.configContexts = {};
		}
		target.constructor.configContexts[propertyKey] = variables;
	};
}
