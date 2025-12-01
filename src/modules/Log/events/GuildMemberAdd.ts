import { Events, GuildMember } from "discord.js";
import { BaseEvent } from "@class/BaseEvent";
import { Event } from "@decorators/Event";
import { LogService } from "@modules/Log/services/LogService";
import { LeBotClient } from "@class/LeBotClient";

@Event({
	name: Events.GuildMemberAdd,
})
export default class GuildMemberAddEvent extends BaseEvent<Events.GuildMemberAdd> {
	async run(client: LeBotClient<true>, member: GuildMember) {
		await LogService.logMemberJoin(member);
	}
}
