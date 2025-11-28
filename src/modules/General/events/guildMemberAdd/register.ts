import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { prismaClient } from "@src/services/prismaService";
import { Logger } from "@utils/Logger";
import { Events, GuildMember } from "discord.js";

@Event({
	name: Events.GuildMemberAdd,
})
export default class RegisterNewMemberEvent extends BaseEvent<Events.GuildMemberAdd> {
	private logger = new Logger("RegisterNewMemberEvent");

	async run(client: LeBotClient<true>, member: GuildMember) {
		try {
			await prismaClient.user.upsert({
				where: {
					id: member.id,
				},
				update: {
					leftAt: null,
				},
				create: {
					id: member.id,
					leftAt: null,
				},
			});
		} catch (error) {
			this.logger.error(
				`Failed to register new member ${member.user.tag} (${member.id}): ${error}`,
			);
		}
	}
}
