import { Events } from "discord.js";

export const BotEvents = {
	...Events,
} as const;

export type BotEvents = (typeof BotEvents)[keyof typeof BotEvents];
