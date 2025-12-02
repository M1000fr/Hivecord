import { BaseEvent } from "@class/BaseEvent";
import type { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { StatsService } from "@modules/Statistics/services/StatsService";
import { BotEvents } from "@src/enums/BotEvents";
import type { GuildMember } from "discord.js";

@Event({ name: BotEvents.GuildMemberAdd })
export default class GuildMemberAddEvent extends BaseEvent<
	typeof BotEvents.GuildMemberAdd
> {
	async run(client: LeBotClient<true>, member: GuildMember): Promise<void> {
		try {
			await StatsService.recordJoin(member.id, member.guild.id);
		} catch (error) {
			console.error("Failed to record join stat:", error);
		}
	}
}
