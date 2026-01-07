export interface IModuleConfigClass {
	isModuleConfig?: boolean;
}

export function ModuleConfig() {
	return (constructor: object) => {
		(constructor as IModuleConfigClass).isModuleConfig = true;
	};
}
