import { InteractionRegistry } from "../services/InteractionRegistry";

export function Button(customId: string) {
	return function (
		target: any,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) {
		InteractionRegistry.registerButton(
			customId,
			descriptor.value.bind(target),
		);
	};
}

export function SelectMenu(customId: string) {
	return function (
		target: any,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) {
		InteractionRegistry.registerSelectMenu(
			customId,
			descriptor.value.bind(target),
		);
	};
}

export function Modal(customId: string) {
	return function (
		target: any,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) {
		InteractionRegistry.registerModal(
			customId,
			descriptor.value.bind(target),
		);
	};
}
