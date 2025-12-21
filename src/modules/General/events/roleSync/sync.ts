import { LeBotClient } from "@class/LeBotClient";
import { EventController } from "@decorators/EventController";
import { On } from "@decorators/On";
import { Client } from "@decorators/params/Client";
import { Context } from "@decorators/params/Context";
import { BotEvents } from "@enums/BotEvents";
import { EntityService } from "@services/EntityService";
import type { PrismaService } from "@src/services/PrismaService";
import type { ContextOf } from "@src/types/ContextOf";
import { Logger } from "@utils/Logger";

@EventController()
export default class RoleSync {
	private logger = new Logger("RoleSync");

	constructor(
		private readonly entityService: EntityService,
		private readonly prisma: PrismaService,
	) {}

	@On(BotEvents.GuildRoleCreate)
	async onCreate(
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

	@On(BotEvents.GuildRoleDelete)
	async onDelete(
		@Client() client: LeBotClient<true>,
		@Context() [role]: ContextOf<typeof BotEvents.GuildRoleDelete>,
	) {
		try {
			await this.prisma.role.upsert({
				where: { id: role.id },
				update: { deletedAt: new Date() },
				create: {
					id: role.id,
					guildId: role.guild.id,
					deletedAt: new Date(),
				},
			});
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
			await this.entityService.ensureRole(newRole);
		} catch (error) {
			this.logger.error(
				`Failed to sync updated role ${newRole.id}: ${error}`,
			);
		}
	}
}
