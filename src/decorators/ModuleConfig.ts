export interface IModuleConfigClass {
	isModuleConfig?: boolean;
}

export function ModuleConfig() {
	return function (constructor: object) {
		(constructor as IModuleConfigClass).isModuleConfig = true;
	};
}
