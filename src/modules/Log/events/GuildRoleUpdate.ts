import { Role } from "discord.js";
import { BaseEvent } from "@class/BaseEvent";
import { Event } from "@decorators/Event";
import { LogService } from "@modules/Log/services/LogService";
import { LeBotClient } from "@class/LeBotClient";
import { BotEvents } from "@enums/BotEvents";

@Event({
	name: BotEvents.GuildRoleUpdate,
})
export default class GuildRoleUpdateEvent extends BaseEvent<typeof BotEvents.GuildRoleUpdate> {
	async run(client: LeBotClient<true>, roleBefore: Role, roleAfter: Role) {
		await LogService.logRoleUpdate(roleBefore.guild, roleBefore, roleAfter);
	}
}
