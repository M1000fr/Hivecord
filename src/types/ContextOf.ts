import type { ClientEvents, GuildMember, Invite } from "discord.js";

export interface CustomEvents extends ClientEvents {
	memberJoinProcessed: [member: GuildMember, invite: Invite | null];
}

export type ContextOf<K extends keyof CustomEvents> =
	K extends keyof ClientEvents
		? ClientEvents[K]
		: K extends keyof CustomEvents
			? CustomEvents[K]
			: unknown[];
