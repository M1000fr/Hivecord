import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { BotEvents } from "@enums/BotEvents";
import { LogService } from "@modules/Log/services/LogService";
import { GuildMember, type PartialGuildMember } from "discord.js";

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
