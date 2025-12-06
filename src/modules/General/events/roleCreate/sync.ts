import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { BotEvents } from "@enums/BotEvents";
import { prismaClient } from "@src/services/prismaService";
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
			await prismaClient.role.upsert({
				where: { id: role.id },
				update: { deletedAt: null },
				create: { id: role.id, guildId: role.guild.id },
			});
			this.logger.log(`Synced created role ${role.name} (${role.id})`);
		} catch (error) {
			this.logger.error(
				`Failed to sync created role ${role.id}: ${error}`,
			);
		}
	}
}
