import { Role } from "discord.js";
import { BaseEvent } from "@class/BaseEvent";
import { Event } from "@decorators/Event";
import { LogService } from "@modules/Log/services/LogService";
import { LeBotClient } from "@class/LeBotClient";
import { BotEvents } from "@enums/BotEvents";

@Event({
	name: BotEvents.GuildRoleDelete,
})
export default class GuildRoleDeleteEvent extends BaseEvent<
	typeof BotEvents.GuildRoleDelete
> {
	async run(client: LeBotClient<true>, role: Role) {
		await LogService.logRoleDelete(role.guild, role);
	}
}
