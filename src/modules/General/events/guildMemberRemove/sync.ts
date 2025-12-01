import { GuildMember } from "discord.js";
import { BaseEvent } from "@class/BaseEvent";
import { Event } from "@decorators/Event";
import { LeBotClient } from "@class/LeBotClient";
import { prismaClient } from "@services/prismaService";
import { BotEvents } from "@enums/BotEvents";

@Event({
	name: BotEvents.GuildMemberRemove,
})
export default class GuildMemberRemoveSyncEvent extends BaseEvent<typeof BotEvents.GuildMemberRemove> {
	async run(client: LeBotClient<true>, member: GuildMember) {
		await prismaClient.user.upsert({
			where: { id: member.id },
			update: { leftAt: new Date() },
			create: { id: member.id, leftAt: new Date() },
		});
	}
}
