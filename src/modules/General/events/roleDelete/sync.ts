import { LeBotClient } from "@class/LeBotClient";
import { Client } from "@decorators/Client";
import { Event } from "@decorators/Event";
import { EventController } from "@decorators/EventController";
import { EventParam } from "@decorators/EventParam";
import { BotEvents } from "@enums/BotEvents";
import { PrismaService } from "@src/services/prismaService";
import { Logger } from "@utils/Logger";
import { Role } from "discord.js";

@EventController()
export default class RoleDeleteEvent {
	private logger = new Logger("RoleDeleteEvent");

	constructor(private readonly prisma: PrismaService) {}

	@Event({
		name: BotEvents.GuildRoleDelete,
	})
	async run(@Client() client: LeBotClient<true>, @EventParam() role: Role) {
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
