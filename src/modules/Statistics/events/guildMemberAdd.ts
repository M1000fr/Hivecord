import { BaseEvent } from "@class/BaseEvent";
import type { LeBotClient } from "@class/LeBotClient";
import type { GuildMember } from "discord.js";
import { StatsService } from "@services/StatsService";
import { Event } from "@decorators/Event";

@Event({ name: "guildMemberAdd" })
export default class GuildMemberAddEvent extends BaseEvent<"guildMemberAdd"> {
	async run(client: LeBotClient<true>, member: GuildMember): Promise<void> {
		try {
			await StatsService.recordJoin(member.id, member.guild.id);
		} catch (error) {
			console.error("Failed to record join stat:", error);
		}
	}
}
