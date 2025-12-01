import { BaseEvent } from "@class/BaseEvent";
import type { LeBotClient } from "@class/LeBotClient";
import type { GuildMember } from "discord.js";
import { StatsService } from "@modules/Statistics/services/StatsService";
import { Event } from "@decorators/Event";
import { BotEvents } from "@src/enums/BotEvents";

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
