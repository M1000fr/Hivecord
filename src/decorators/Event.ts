import { BaseEvent } from "@class/BaseEvent";
import type { EventOptions } from "@interfaces/EventOptions";
import type { IEventClass } from "@interfaces/IEventClass";
import type { ClientEvents } from "discord.js";

export function Event<K extends keyof ClientEvents | string>(
	options: EventOptions<K>,
) {
	return function (target: unknown) {
		const eventClass = target as IEventClass;
		// Validation: @Event ne peut être utilisé que sur des classes étendant BaseEvent
		if (!(eventClass.prototype instanceof BaseEvent)) {
			throw new Error(
				`@Event decorator can only be used on classes extending BaseEvent. ` +
					`Class "${eventClass.name}" does not extend BaseEvent.`,
			);
		}
		eventClass.eventOptions = options;
	};
}
