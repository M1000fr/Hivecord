import type { ClientEvents } from "discord.js";

export type CustomEvents = ClientEvents;

export type ContextOf<K extends keyof CustomEvents> =
	K extends keyof ClientEvents
		? ClientEvents[K]
		: K extends keyof CustomEvents
			? CustomEvents[K]
			: unknown[];
