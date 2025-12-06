import { InteractionRegistry } from "@registers/InteractionRegistry";

export function Button(customId: string) {
	return function (
		target: object,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) {
		InteractionRegistry.registerButton(
			customId,
			descriptor.value.bind(target),
		);
	};
}

export function ButtonPattern(pattern: string) {
	return function (
		target: object,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) {
		InteractionRegistry.registerButtonPattern(
			pattern,
			descriptor.value.bind(target),
		);
	};
}

export function SelectMenu(customId: string) {
	return function (
		target: object,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) {
		InteractionRegistry.registerSelectMenu(
			customId,
			descriptor.value.bind(target),
		);
	};
}

export function SelectMenuPattern(pattern: string) {
	return function (
		target: object,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) {
		InteractionRegistry.registerSelectMenuPattern(
			pattern,
			descriptor.value.bind(target),
		);
	};
}

export function Modal(customId: string) {
	return function (
		target: object,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) {
		InteractionRegistry.registerModal(
			customId,
			descriptor.value.bind(target),
		);
	};
}

export function ModalPattern(pattern: string) {
	return function (
		target: object,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) {
		InteractionRegistry.registerModalPattern(
			pattern,
			descriptor.value.bind(target),
		);
	};
}
