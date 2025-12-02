import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { BotEvents } from "@enums/BotEvents";
import { LogService } from "@modules/Log/services/LogService";
import { Role } from "discord.js";

@Event({
	name: BotEvents.GuildRoleCreate,
})
export default class GuildRoleCreateEvent extends BaseEvent<
	typeof BotEvents.GuildRoleCreate
> {
	async run(client: LeBotClient<true>, role: Role) {
		await LogService.logRoleCreate(role.guild, role);
	}
}
