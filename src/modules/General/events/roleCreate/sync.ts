import { LeBotClient } from "@class/LeBotClient";
import { Client } from "@decorators/Client";
import { Context } from "@decorators/Context";
import { EventController } from "@decorators/EventController";
import { On } from "@decorators/On";
import { BotEvents } from "@enums/BotEvents";
import { EntityService } from "@services/EntityService";
import type { ContextOf } from "@src/types/ContextOf";
import { Logger } from "@utils/Logger";

@EventController()
export default class RoleCreateEvent {
	private logger = new Logger("RoleCreateEvent");

	constructor(private readonly entityService: EntityService) {}

	@On(BotEvents.GuildRoleCreate)
	async run(
		@Client() client: LeBotClient<true>,
		@Context() [role]: ContextOf<typeof BotEvents.GuildRoleCreate>,
	) {
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
