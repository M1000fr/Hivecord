import { LeBotClient } from "@class/LeBotClient";
import { EventController } from "@decorators/EventController";
import { On } from "@decorators/On";
import { Client } from "@decorators/params/Client";
import { Context } from "@decorators/params/Context";
import { BotEvents } from "@enums/BotEvents";
import { RoleRepository } from "@src/repositories";
import type { ContextOf } from "@src/types/ContextOf.ts";
import { Logger } from "@utils/Logger";

@EventController()
export default class RoleSync {
	private logger = new Logger("RoleSync");

	constructor(private readonly roleRepository: RoleRepository) {}

	@On(BotEvents.GuildRoleCreate)
	async onCreate(
		@Client() client: LeBotClient<true>,
		@Context() [role]: ContextOf<typeof BotEvents.GuildRoleCreate>,
	) {
		try {
			await this.roleRepository.upsert(role);
			this.logger.log(`Synced created role ${role.name} (${role.id})`);
		} catch (error) {
			this.logger.error(
				`Failed to sync created role ${role.id}: ${error}`,
			);
		}
	}

	@On(BotEvents.GuildRoleDelete)
	async onDelete(
		@Client() client: LeBotClient<true>,
		@Context() [role]: ContextOf<typeof BotEvents.GuildRoleDelete>,
	) {
		try {
			await this.roleRepository.delete(role);
			this.logger.log(`Synced deleted role ${role.name} (${role.id})`);
		} catch (error) {
			this.logger.error(
				`Failed to sync deleted role ${role.id}: ${error}`,
			);
		}
	}

	@On(BotEvents.GuildRoleUpdate)
	async onUpdate(
		@Client() client: LeBotClient<true>,
		@Context()
		[_oldRole, newRole]: ContextOf<typeof BotEvents.GuildRoleUpdate>,
	) {
		try {
			await this.roleRepository.upsert(newRole);
		} catch (error) {
			this.logger.error(
				`Failed to sync updated role ${newRole.id}: ${error}`,
			);
		}
	}
}
