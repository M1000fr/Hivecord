import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { prismaClient } from "@src/services/prismaService";
import { Logger } from "@utils/Logger";
import { Events, GuildMember } from "discord.js";

@Event({
	name: Events.GuildMemberRemove,
})
export default class LeftMemberEvent extends BaseEvent<Events.GuildMemberRemove> {
	private logger = new Logger("LeftMemberEvent");

	async run(client: LeBotClient<true>, member: GuildMember) {
		try {
			await prismaClient.user.upsert({
				where: {
					id: member.id,
				},
				update: {
					leftAt: new Date(),
				},
				create: {
					id: member.id,
					leftAt: new Date(),
				},
			});
		} catch (error) {
			this.logger.error(
				`Failed to register left member ${member.user.tag} (${member.id}): ${error}`,
			);
		}
	}
}
