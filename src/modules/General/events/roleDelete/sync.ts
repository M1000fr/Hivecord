import { LeBotClient } from "@class/LeBotClient";
import { Client } from "@decorators/Client";
import { Context } from "@decorators/Context";
import { EventController } from "@decorators/EventController";
import { On } from "@decorators/On";
import { BotEvents } from "@enums/BotEvents";
import { PrismaService } from "@src/services/prismaService";
import type { ContextOf } from "@src/types/ContextOf";
import { Logger } from "@utils/Logger";

@EventController()
export default class RoleDeleteEvent {
	private logger = new Logger("RoleDeleteEvent");

	constructor(private readonly prisma: PrismaService) {}

	@On(BotEvents.GuildRoleDelete)
	async run(
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
}
