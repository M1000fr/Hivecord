import { ClientEvents } from "discord.js";
import { LeBotClient } from "./LeBotClient";

export abstract class BaseEvent<K extends keyof ClientEvents> {
    abstract run(client: LeBotClient<true>, ...args: ClientEvents[K]): Promise<void> | void;
}
