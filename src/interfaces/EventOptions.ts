import { ClientEvents } from "discord.js";

export interface EventOptions<K extends keyof ClientEvents | string> {
  name: K;
  once?: boolean;
}
