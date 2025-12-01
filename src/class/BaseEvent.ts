import type { ClientEvents } from "discord.js";
import { LeBotClient } from "./LeBotClient";

export abstract class BaseEvent<K extends keyof ClientEvents | string> {
	abstract run(
		client: LeBotClient<true>,
		...args: K extends keyof ClientEvents ? ClientEvents[K] : any[]
	): Promise<void> | void;
}
