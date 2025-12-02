import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { BotEvents } from "@enums/BotEvents";
import { prismaClient } from "@src/services/prismaService";
import { Logger } from "@utils/Logger";
import { GuildMember } from "discord.js";

@Event({
	name: BotEvents.GuildMemberAdd,
})
export default class GuildMemberRegisterEvent extends BaseEvent<
	typeof BotEvents.GuildMemberAdd
> {
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
