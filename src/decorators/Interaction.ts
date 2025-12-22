import { DependencyContainer } from "@di/DependencyContainer";
import type { Constructor } from "@di/types";
import { InteractionRegistry } from "@registers/InteractionRegistry";
import {
	COMMAND_PARAMS_METADATA_KEY,
	type CommandParameter,
	CommandParamType,
	registerCommandParameter,
} from "@decorators/params/index.ts";

function createHandler(target: object, propertyKey: string) {
	return async (interaction: unknown) => {
		const container = DependencyContainer.getInstance();
		const instance = container.resolve(
			target.constructor as Constructor,
		) as Record<string, (...args: unknown[]) => Promise<void>>;
		const method = instance[propertyKey];
		if (method) {
			const params: CommandParameter[] =
				Reflect.getMetadata(
					COMMAND_PARAMS_METADATA_KEY,
					target,
					propertyKey,
				) || [];

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

export function Button(customId: string) {
	return function (
		target: object,
		propertyKey: string,
		_descriptor: PropertyDescriptor,
	) {
		InteractionRegistry.registerButton(
			customId,
			createHandler(target, propertyKey),
		);
	};
}

export function ButtonPattern(pattern: string) {
	return function (
		target: object,
		propertyKey: string,
		_descriptor: PropertyDescriptor,
	) {
		InteractionRegistry.registerButtonPattern(
			pattern,
			createHandler(target, propertyKey),
		);
	};
}

export function SelectMenu(customId: string) {
	return function (
		target: object,
		propertyKey: string,
		_descriptor: PropertyDescriptor,
	) {
		InteractionRegistry.registerSelectMenu(
			customId,
			createHandler(target, propertyKey),
		);
	};
}

export function SelectMenuPattern(pattern: string) {
	return function (
		target: object,
		propertyKey: string,
		_descriptor: PropertyDescriptor,
	) {
		InteractionRegistry.registerSelectMenuPattern(
			pattern,
			createHandler(target, propertyKey),
		);
	};
}

export function Modal(customId: string) {
	return function (
		target: object,
		propertyKey: string,
		_descriptor: PropertyDescriptor,
	) {
		InteractionRegistry.registerModal(
			customId,
			createHandler(target, propertyKey),
		);
	};
}

export function ModalPattern(pattern: string) {
	return function (
		target: object,
		propertyKey: string,
		_descriptor: PropertyDescriptor,
	) {
		InteractionRegistry.registerModalPattern(
			pattern,
			createHandler(target, propertyKey),
		);
	};
}

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
