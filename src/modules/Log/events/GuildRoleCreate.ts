import { Role } from "discord.js";
import { BaseEvent } from "@class/BaseEvent";
import { Event } from "@decorators/Event";
import { LogService } from "@modules/Log/services/LogService";
import { LeBotClient } from "@class/LeBotClient";
import { BotEvents } from "@enums/BotEvents";

@Event({
	name: BotEvents.GuildRoleCreate,
})
export default class GuildRoleCreateEvent extends BaseEvent<typeof BotEvents.GuildRoleCreate> {
	async run(client: LeBotClient<true>, role: Role) {
		await LogService.logRoleCreate(role.guild, role);
	}
}
