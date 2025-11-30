import { BaseEvent } from "@class/BaseEvent";
import type { LeBotClient } from "@class/LeBotClient";
import type { GuildMember } from "discord.js";
import { StatsService } from "@services/StatsService";
import { Event } from "@decorators/Event";

@Event({ name: "guildMemberRemove" })
export default class GuildMemberRemoveEvent extends BaseEvent<"guildMemberRemove"> {
	async run(client: LeBotClient<true>, member: GuildMember): Promise<void> {
		try {
			await StatsService.recordLeave(member.id, member.guild.id);
		} catch (error) {
			console.error("Failed to record leave stat:", error);
		}
	}
}
