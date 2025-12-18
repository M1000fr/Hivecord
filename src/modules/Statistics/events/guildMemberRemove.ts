import { BaseEvent } from "@class/BaseEvent";
import type { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { StatsWriter } from "@modules/Statistics/services/StatsWriter";
import { BotEvents } from "@src/enums/BotEvents";
import type { GuildMember } from "discord.js";

@Event({ name: BotEvents.GuildMemberRemove })
export default class GuildMemberRemoveEvent extends BaseEvent<
	typeof BotEvents.GuildMemberRemove
> {
	async run(client: LeBotClient<true>, member: GuildMember): Promise<void> {
		try {
			await StatsWriter.recordLeave(member.id, member.guild.id);
		} catch (error) {
			console.error("Failed to record leave stat:", error);
		}
	}
}
