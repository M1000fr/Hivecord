import type { EventOptions } from '@interfaces/EventOptions';
import type { ClientEvents } from "discord.js";

export function Event<K extends keyof ClientEvents | string>(options: EventOptions<K>) {
	return function (target: Function) {
		(target as any).eventOptions = options;
	};
}
