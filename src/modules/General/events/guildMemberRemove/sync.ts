import { Events, GuildMember } from "discord.js";
import { BaseEvent } from "@class/BaseEvent";
import { Event } from "@decorators/Event";
import { LeBotClient } from "@class/LeBotClient";
import { prismaClient } from "@services/prismaService";

@Event({
	name: Events.GuildMemberRemove,
})
export default class GuildMemberRemoveSyncEvent extends BaseEvent<Events.GuildMemberRemove> {
	async run(client: LeBotClient<true>, member: GuildMember) {
		await prismaClient.user.upsert({
			where: { id: member.id },
			update: { leftAt: new Date() },
			create: { id: member.id, leftAt: new Date() },
		});
	}
}
