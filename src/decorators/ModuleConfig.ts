export interface IModuleConfigClass {
  isModuleConfig?: boolean;
}

export function ModuleConfig(): ClassDecorator {
  return (constructor: Function) => {
    (constructor as unknown as IModuleConfigClass).isModuleConfig = true;
  };
}
