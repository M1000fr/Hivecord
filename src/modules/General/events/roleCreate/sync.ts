import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { BotEvents } from "@enums/BotEvents";
import { EntityService } from "@services/EntityService";
import { Logger } from "@utils/Logger";
import { Role } from "discord.js";

@Event({
	name: BotEvents.GuildRoleCreate,
})
export default class RoleCreateEvent extends BaseEvent<
	typeof BotEvents.GuildRoleCreate
> {
	private logger = new Logger("RoleCreateEvent");

	async run(client: LeBotClient<true>, role: Role) {
		try {
			await EntityService.ensureRole(role);
			this.logger.log(`Synced created role ${role.name} (${role.id})`);
		} catch (error) {
			this.logger.error(
				`Failed to sync created role ${role.id}: ${error}`,
			);
		}
	}
}
