import { ConfigContextVariable } from "@enums/ConfigContextVariable";

export interface IConfigClass {
  configContexts?: Record<string, ConfigContextVariable[]>;
}

export function ConfigContext(
  variables: ConfigContextVariable[],
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const constructor = target.constructor as IConfigClass;
    if (!constructor.configContexts) {
      constructor.configContexts = {};
    }
    constructor.configContexts[propertyKey as string] = variables;
  };
}
