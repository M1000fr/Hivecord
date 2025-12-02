import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { BotEvents } from "@enums/BotEvents";
import { LogService } from "@modules/Log/services/LogService";
import { Role } from "discord.js";

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
