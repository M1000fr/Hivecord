import { Events, GuildMember, type PartialGuildMember } from "discord.js";
import { BaseEvent } from "../../class/BaseEvent";
import { Event } from "../../decorators/Event";
import { LeBotClient } from "../../class/LeBotClient";
import { prismaClient } from "../../services/prismaService";
import { Logger } from "../../utils/Logger";

@Event({
	name: Events.GuildMemberRemove,
})
export default class GuildMemberRemoveEvent extends BaseEvent<Events.GuildMemberRemove> {
	private logger = new Logger("GuildMemberRemoveEvent");

	async run(
		client: LeBotClient<true>,
		member: GuildMember | PartialGuildMember,
	) {
		try {
			await prismaClient.user.update({
				where: { id: member.id },
				data: {
					leftAt: new Date(),
				},
			});
			this.logger.log(
				`User ${member.user?.username || member.id} marked as left in DB.`,
			);
		} catch (error) {
			this.logger.error(
				`Failed to mark user ${member.id} as left:`,
				(error as Error)?.stack || String(error),
			);
		}
	}
}
