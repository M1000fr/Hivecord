import { Events, Role } from "discord.js";
import { BaseEvent } from "@class/BaseEvent";
import { Event } from "@decorators/Event";
import { LogService } from "@services/LogService";
import { LeBotClient } from "@class/LeBotClient";

@Event({
	name: Events.GuildRoleCreate,
})
export default class GuildRoleCreateEvent extends BaseEvent<Events.GuildRoleCreate> {
	async run(client: LeBotClient<true>, role: Role) {
		await LogService.logRoleCreate(role.guild, role);
	}
}
