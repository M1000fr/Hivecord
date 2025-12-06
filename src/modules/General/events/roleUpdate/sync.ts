import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { BotEvents } from "@enums/BotEvents";
import { EntityService } from "@services/EntityService";
import { Logger } from "@utils/Logger";
import { Role } from "discord.js";

@Event({
	name: BotEvents.GuildRoleUpdate,
})
export default class RoleUpdateEvent extends BaseEvent<
	typeof BotEvents.GuildRoleUpdate
> {
	private logger = new Logger("RoleUpdateEvent");

	async run(client: LeBotClient<true>, oldRole: Role, newRole: Role) {
		try {
			await EntityService.ensureRole(newRole);
		} catch (error) {
			this.logger.error(
				`Failed to sync updated role ${newRole.id}: ${error}`,
			);
		}
	}
}
