import { type Constructor, INTERCEPTORS_METADATA_KEY } from "@di/types";
import { type IInterceptor } from "@interfaces/IInterceptor";
import "reflect-metadata";

export function UseInterceptors(
  ...interceptors: Constructor<IInterceptor>[]
): ClassDecorator & MethodDecorator {
  return (
    target: any,
    propertyKey?: string | symbol,
    _descriptor?: PropertyDescriptor,
  ) => {
    if (propertyKey) {
      // Method decorator
      Reflect.defineMetadata(
        INTERCEPTORS_METADATA_KEY,
        interceptors,
        target,
        propertyKey,
      );
    } else {
      // Class decorator
      Reflect.defineMetadata(INTERCEPTORS_METADATA_KEY, interceptors, target);
    }
  };
}
