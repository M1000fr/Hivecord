import { DependencyContainer } from "@di/DependencyContainer";
import type { Constructor } from "@di/types";
import { InteractionRegistry } from "@registers/InteractionRegistry";

function createHandler(target: object, propertyKey: string) {
	return async (interaction: unknown) => {
		const container = DependencyContainer.getInstance();
		const instance = container.resolve(
			target.constructor as Constructor,
		) as Record<string, (interaction: unknown) => Promise<void>>;
		const method = instance[propertyKey];
		if (method) {
			await method.call(instance, interaction);
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

import { CommandParamType, registerCommandParameter } from "@decorators/params";

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
