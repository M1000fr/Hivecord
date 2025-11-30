import { Events, Role } from "discord.js";
import { BaseEvent } from "@class/BaseEvent";
import { Event } from "@decorators/Event";
import { LogService } from "@services/LogService";
import { LeBotClient } from "@class/LeBotClient";

@Event({
	name: Events.GuildRoleUpdate,
})
export default class GuildRoleUpdateEvent extends BaseEvent<Events.GuildRoleUpdate> {
	async run(client: LeBotClient<true>, roleBefore: Role, roleAfter: Role) {
		await LogService.logRoleUpdate(roleBefore.guild, roleBefore, roleAfter);
	}
}
