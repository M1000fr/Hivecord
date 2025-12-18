import { BaseEvent } from "@class/BaseEvent";
import type { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { StatsWriter } from "@modules/Statistics/services/StatsWriter";
import { BotEvents } from "@src/enums/BotEvents";
import type { GuildMember } from "discord.js";

@Event({ name: BotEvents.GuildMemberAdd })
export default class GuildMemberAddEvent extends BaseEvent<
	typeof BotEvents.GuildMemberAdd
> {
	async run(client: LeBotClient<true>, member: GuildMember): Promise<void> {
		try {
			await StatsWriter.recordJoin(member.id, member.guild.id);
		} catch (error) {
			console.error("Failed to record join stat:", error);
		}
	}
}
