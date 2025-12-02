import { GuildMember } from "discord.js";
import { BaseEvent } from "@class/BaseEvent";
import { Event } from "@decorators/Event";
import { LogService } from "@modules/Log/services/LogService";
import { LeBotClient } from "@class/LeBotClient";
import { BotEvents } from "@enums/BotEvents";

@Event({
	name: BotEvents.GuildMemberAdd,
})
export default class GuildMemberAddEvent extends BaseEvent<
	typeof BotEvents.GuildMemberAdd
> {
	async run(client: LeBotClient<true>, member: GuildMember) {
		await LogService.logMemberJoin(member);
	}
}
