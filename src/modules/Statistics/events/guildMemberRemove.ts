import { BaseEvent } from "@class/BaseEvent";
import type { LeBotClient } from "@class/LeBotClient";
import type { GuildMember } from "discord.js";
import { StatsService } from "@modules/Statistics/services/StatsService";
import { Event } from "@decorators/Event";
import { BotEvents } from "@src/enums/BotEvents";

@Event({ name: BotEvents.GuildMemberRemove })
export default class GuildMemberRemoveEvent extends BaseEvent<
	typeof BotEvents.GuildMemberRemove
> {
	async run(client: LeBotClient<true>, member: GuildMember): Promise<void> {
		try {
			await StatsService.recordLeave(member.id, member.guild.id);
		} catch (error) {
			console.error("Failed to record leave stat:", error);
		}
	}
}
