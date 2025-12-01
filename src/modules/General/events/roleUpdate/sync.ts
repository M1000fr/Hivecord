import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { prismaClient } from "@src/services/prismaService";
import { Logger } from "@utils/Logger";
import { Role } from "discord.js";
import { BotEvents } from "@enums/BotEvents";

@Event({
	name: BotEvents.GuildRoleUpdate,
})
export default class RoleUpdateEvent extends BaseEvent<typeof BotEvents.GuildRoleUpdate> {
	private logger = new Logger("RoleUpdateEvent");

	async run(client: LeBotClient<true>, oldRole: Role, newRole: Role) {
		try {
			await prismaClient.role.upsert({
				where: { id: newRole.id },
				update: { deletedAt: null },
				create: { id: newRole.id },
			});
		} catch (error) {
			this.logger.error(`Failed to sync updated role ${newRole.id}: ${error}`);
		}
	}
}
