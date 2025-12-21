import type { EventOptions } from "@interfaces/EventOptions.ts";
import type { ClientEvents } from "discord.js";
import "reflect-metadata";

export const EVENT_METADATA_KEY = "lebot:event";

export function On<K extends keyof ClientEvents | string>(
	options: EventOptions<K> | K,
) {
	return function (
		target: object,
		propertyKey: string | symbol,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		descriptor: PropertyDescriptor,
	) {
		const eventOptions =
			typeof options === "string" ? { name: options } : options;
		Reflect.defineMetadata(
			EVENT_METADATA_KEY,
			eventOptions,
			target,
			propertyKey,
		);
	};
}
