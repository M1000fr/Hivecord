import {
  COMMAND_PARAMS_METADATA_KEY,
  type CommandParameter,
  CommandParamType,
  registerCommandParameter,
} from "@decorators/params/index.ts";
import { DependencyContainer } from "@di/DependencyContainer";
import { Constructor } from "@di/types";
import { InteractionRegistry } from "@registers/InteractionRegistry";

type InteractionHandler = (interaction: unknown) => Promise<void>;

function createHandler(target: object, propertyKey: string) {
  return async (interaction: unknown) => {
    const container = DependencyContainer.getInstance();
    const instance = container.resolve(
      target.constructor as Constructor,
    ) as Record<string, (...args: unknown[]) => Promise<void>>;
    const method = instance[propertyKey];
    if (method) {
      const params: CommandParameter[] =
        Reflect.getMetadata(COMMAND_PARAMS_METADATA_KEY, target, propertyKey) ||
        [];

      const args: unknown[] = [];
      for (const param of params) {
        switch (param.type) {
          case CommandParamType.Client:
            args[param.index] = container.resolve("Client");
            break;
          case CommandParamType.Interaction:
            args[param.index] = interaction;
            break;
          // Ajoutez d'autres cas si nécessaire
          default:
            break;
        }
      }

      await method.call(instance, ...args);
    }
  };
}

/**
 * Factory function to create interaction decorators with minimal duplication
 */
function createInteractionDecorator(registryMethods: {
  exact: (customId: string, handler: InteractionHandler) => void;
  pattern: (customId: string, handler: InteractionHandler) => void;
}) {
  return (customId: string) =>
    (target: object, propertyKey: string, _descriptor: PropertyDescriptor) => {
      const isPattern = customId.includes("*");
      const handler = createHandler(target, propertyKey);
      if (isPattern) {
        registryMethods.pattern(customId, handler);
      } else {
        registryMethods.exact(customId, handler);
      }
    };
}

export const Button = createInteractionDecorator({
  exact: (customId, handler) =>
    InteractionRegistry.registerButton(customId, handler),
  pattern: (customId, handler) =>
    InteractionRegistry.registerButtonPattern(customId, handler),
});

export const SelectMenu = createInteractionDecorator({
  exact: (customId, handler) =>
    InteractionRegistry.registerSelectMenu(customId, handler),
  pattern: (customId, handler) =>
    InteractionRegistry.registerSelectMenuPattern(customId, handler),
});

export const Modal = createInteractionDecorator({
  exact: (customId, handler) =>
    InteractionRegistry.registerModal(customId, handler),
  pattern: (customId, handler) =>
    InteractionRegistry.registerModalPattern(customId, handler),
});

export function CommandInteraction(): ParameterDecorator {
  return (
    target: object,
    propertyKey: string | symbol | undefined,
    parameterIndex: number,
  ) => {
    registerCommandParameter(
      target,
      propertyKey,
      parameterIndex,
      CommandParamType.Interaction,
    );
  };
}

export function AutocompleteInteraction(): ParameterDecorator {
  return (
    target: object,
    propertyKey: string | symbol | undefined,
    parameterIndex: number,
  ) => {
    registerCommandParameter(
      target,
      propertyKey,
      parameterIndex,
      CommandParamType.AutocompleteInteraction,
    );
  };
}
