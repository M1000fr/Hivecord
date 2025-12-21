import { LeBotClient } from "@class/LeBotClient";
import { Client } from "@decorators/Client";
import { Event } from "@decorators/Event";
import { EventController } from "@decorators/EventController";
import { EventParam } from "@decorators/EventParam";
import { BotEvents } from "@enums/BotEvents";
import { EntityService } from "@src/services/EntityService";
import { Logger } from "@utils/Logger";
import { Role } from "discord.js";

@EventController()
export default class RoleUpdateEvent {
	private logger = new Logger("RoleUpdateEvent");

	constructor(private readonly entityService: EntityService) {}

	@Event({
		name: BotEvents.GuildRoleUpdate,
	})
	async run(
		@Client() client: LeBotClient<true>,
		@EventParam() oldRole: Role,
		@EventParam() newRole: Role,
	) {
		try {
			await this.entityService.ensureRole(newRole);
		} catch (error) {
			this.logger.error(
				`Failed to sync updated role ${newRole.id}: ${error}`,
			);
		}
	}
}
