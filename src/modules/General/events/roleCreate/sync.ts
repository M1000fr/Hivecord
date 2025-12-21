import { LeBotClient } from "@class/LeBotClient";
import { Client } from "@decorators/Client";
import { Event } from "@decorators/Event";
import { EventController } from "@decorators/EventController";
import { EventParam } from "@decorators/EventParam";
import { BotEvents } from "@enums/BotEvents";
import { EntityService } from "@services/EntityService";
import { Logger } from "@utils/Logger";
import { Role } from "discord.js";

@EventController()
export default class RoleCreateEvent {
	private logger = new Logger("RoleCreateEvent");

	constructor(private readonly entityService: EntityService) {}

	@Event({
		name: BotEvents.GuildRoleCreate,
	})
	async run(@Client() client: LeBotClient<true>, @EventParam() role: Role) {
		try {
			await this.entityService.ensureRole(role);
			this.logger.log(`Synced created role ${role.name} (${role.id})`);
		} catch (error) {
			this.logger.error(
				`Failed to sync created role ${role.id}: ${error}`,
			);
		}
	}
}
