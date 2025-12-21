import type { EventOptions } from "@interfaces/EventOptions";
import type { IEventClass } from "@interfaces/IEventClass";
import type { ClientEvents } from "discord.js";

export function Event<K extends keyof ClientEvents | string>(
	options: EventOptions<K>,
) {
	return function (
		target: object,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		propertyKey: string | symbol,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		descriptor: PropertyDescriptor,
	) {
		const constructor = target.constructor as IEventClass;
		constructor.eventOptions = options;
	};
}
