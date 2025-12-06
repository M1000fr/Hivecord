import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { BotEvents } from "@enums/BotEvents";
import { prismaClient } from "@src/services/prismaService";
import { Logger } from "@utils/Logger";
import { Role } from "discord.js";

@Event({
	name: BotEvents.GuildRoleDelete,
})
export default class RoleDeleteEvent extends BaseEvent<
	typeof BotEvents.GuildRoleDelete
> {
	private logger = new Logger("RoleDeleteEvent");

	async run(client: LeBotClient<true>, role: Role) {
		try {
			await prismaClient.role.upsert({
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
