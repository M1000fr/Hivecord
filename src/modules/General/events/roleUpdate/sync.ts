import { LeBotClient } from "@class/LeBotClient";
import { Client } from "@decorators/Client";
import { Context } from "@decorators/Context";
import { EventController } from "@decorators/EventController";
import { On } from "@decorators/On";
import { BotEvents } from "@enums/BotEvents";
import { EntityService } from "@src/services/EntityService";
import type { ContextOf } from "@src/types/ContextOf";
import { Logger } from "@utils/Logger";

@EventController()
export default class RoleUpdateEvent {
	private logger = new Logger("RoleUpdateEvent");

	constructor(private readonly entityService: EntityService) {}

	@On(BotEvents.GuildRoleUpdate)
	async run(
		@Client() client: LeBotClient<true>,
		@Context()
		[_oldRole, newRole]: ContextOf<typeof BotEvents.GuildRoleUpdate>,
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
