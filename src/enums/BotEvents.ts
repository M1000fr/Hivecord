import { Events } from "discord.js";

export const BotEvents = {
	...Events,
	MemberJoinProcessed: "memberJoinProcessed",
	StatsUpdated: "statsUpdated",
} as const;

export type BotEvents = (typeof BotEvents)[keyof typeof BotEvents];
