import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { BotEvents } from "@enums/BotEvents";
import { LogService } from "@modules/Log/services/LogService";
import { GuildMember } from "discord.js";

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
