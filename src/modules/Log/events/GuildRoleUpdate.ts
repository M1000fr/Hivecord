import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { BotEvents } from "@enums/BotEvents";
import { LogService } from "@modules/Log/services/LogService";
import { Role } from "discord.js";

@Event({
	name: BotEvents.GuildRoleUpdate,
})
export default class GuildRoleUpdateEvent extends BaseEvent<
	typeof BotEvents.GuildRoleUpdate
> {
	async run(client: LeBotClient<true>, roleBefore: Role, roleAfter: Role) {
		await LogService.logRoleUpdate(roleBefore.guild, roleBefore, roleAfter);
	}
}
