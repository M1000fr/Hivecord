import { IExecutionContext } from "./IExecutionContext";

export interface IInterceptor {
  intercept(
    context: IExecutionContext,
    next: () => Promise<void>,
  ): Promise<void>;
}
