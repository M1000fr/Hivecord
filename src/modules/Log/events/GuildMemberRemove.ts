import { GuildMember, type PartialGuildMember } from "discord.js";
import { BaseEvent } from "@class/BaseEvent";
import { Event } from "@decorators/Event";
import { LogService } from "@modules/Log/services/LogService";
import { LeBotClient } from "@class/LeBotClient";
import { BotEvents } from "@enums/BotEvents";

@Event({
	name: BotEvents.GuildMemberRemove,
})
export default class GuildMemberRemoveEvent extends BaseEvent<
	typeof BotEvents.GuildMemberRemove
> {
	async run(
		client: LeBotClient<true>,
		member: GuildMember | PartialGuildMember,
	) {
		await LogService.logMemberLeave(member);
	}
}
