import { LeBotClient } from "@class/LeBotClient";
import { Client } from "@decorators/Client";
import { Context } from "@decorators/Context";
import { EventController } from "@decorators/EventController";
import { On } from "@decorators/On";
import { BotEvents } from "@enums/BotEvents";
import { PrismaService } from "@services/prismaService";
import type { ContextOf } from "@src/types/ContextOf";

@EventController()
export default class GuildMemberRemoveSyncEvent {
	constructor(private readonly prisma: PrismaService) {}

	@On(BotEvents.GuildMemberRemove)
	async run(
		@Client() client: LeBotClient<true>,
		@Context() [member]: ContextOf<typeof BotEvents.GuildMemberRemove>,
	) {
		await this.prisma.user.upsert({
			where: { id: member.id },
			update: { leftAt: new Date() },
			create: { id: member.id, leftAt: new Date() },
		});
	}
}
