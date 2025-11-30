import { Events, Role } from "discord.js";
import { BaseEvent } from "@class/BaseEvent";
import { Event } from "@decorators/Event";
import { LogService } from "@services/LogService";
import { LeBotClient } from "@class/LeBotClient";

@Event({
	name: Events.GuildRoleDelete,
})
export default class GuildRoleDeleteEvent extends BaseEvent<Events.GuildRoleDelete> {
	async run(client: LeBotClient<true>, role: Role) {
		await LogService.logRoleDelete(role.guild, role);
	}
}
