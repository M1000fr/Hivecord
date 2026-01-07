import type { ConfigContextVariable } from "@enums/ConfigContextVariable";

export interface IConfigClass {
	configContexts?: Record<string, ConfigContextVariable[]>;
}

export function ConfigContext(variables: ConfigContextVariable[]) {
	return (target: object, propertyKey: string) => {
		const constructor = target.constructor as IConfigClass;
		if (!constructor.configContexts) {
			constructor.configContexts = {};
		}
		constructor.configContexts[propertyKey] = variables;
	};
}
