import type { ClientEvents } from "discord.js";
import { LeBotClient } from "./LeBotClient";

export abstract class BaseEvent<K extends keyof ClientEvents | string> {
	abstract run(
		client: LeBotClient<boolean>,
		...args: K extends keyof ClientEvents ? ClientEvents[K] : unknown[]
	): Promise<void> | void;
}
