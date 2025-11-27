import type { ClientEvents } from "discord.js";
import type { LeBotClient } from "../class/LeBotClient";

export type EventHandler<e extends keyof ClientEvents> = (
	client: LeBotClient<true>,
	...args: ClientEvents[e]
) => Promise<void> | void;
