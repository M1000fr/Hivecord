import type { ClientEvents } from "discord.js";

export interface EventOptions<K extends keyof ClientEvents> {
    name: K;
    once?: boolean;
}
