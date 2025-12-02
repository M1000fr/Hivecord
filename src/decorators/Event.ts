import type { EventOptions } from '@interfaces/EventOptions';
import type { ClientEvents } from "discord.js";
import { BaseEvent } from '@class/BaseEvent';

export function Event<K extends keyof ClientEvents | string>(options: EventOptions<K>) {
	return function (target: Function) {
		// Validation: @Event ne peut être utilisé que sur des classes étendant BaseEvent
		if (!(target.prototype instanceof BaseEvent)) {
			throw new Error(
				`@Event decorator can only be used on classes extending BaseEvent. ` +
				`Class "${target.name}" does not extend BaseEvent.`
			);
		}
		(target as any).eventOptions = options;
	};
}
