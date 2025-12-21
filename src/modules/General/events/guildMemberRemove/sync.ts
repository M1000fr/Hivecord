import { LeBotClient } from "@class/LeBotClient";
import { Client } from "@decorators/Client";
import { Event } from "@decorators/Event";
import { EventController } from "@decorators/EventController";
import { EventParam } from "@decorators/EventParam";
import { BotEvents } from "@enums/BotEvents";
import { prismaClient } from "@services/prismaService";
import { GuildMember } from "discord.js";

@EventController()
export default class GuildMemberRemoveSyncEvent {
	@Event({
		name: BotEvents.GuildMemberRemove,
	})
	async run(
		@Client() client: LeBotClient<true>,
		@EventParam() member: GuildMember,
	) {
		await prismaClient.user.upsert({
			where: { id: member.id },
			update: { leftAt: new Date() },
			create: { id: member.id, leftAt: new Date() },
		});
	}
}
