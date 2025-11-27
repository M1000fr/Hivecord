import type { ClientEvents } from "discord.js";
import type { EventHandler } from "../interfaces/EventHandler";

export class EventBuilder<Key extends keyof ClientEvents> {
	private handler!: EventHandler<Key>;
	private once = false;

	constructor(public name: Key) {}

	public setHandler(handler: EventHandler<Key>): EventBuilder<Key> {
		this.handler = handler;
		return this;
	}

	public setOnce(once: boolean): EventBuilder<Key> {
		this.once = once;
		return this;
	}

	public build() {
		return {
			name: this.name,
			handler: this.handler,
			once: this.once,
		};
	}
}
