import { LeBotClient } from "@class/LeBotClient";
import { EventController } from "@decorators/EventController";
import { On } from "@decorators/On";
import { Client } from "@decorators/params/Client";
import { Context } from "@decorators/params/Context";
import { BotEvents } from "@enums/BotEvents";
import { EntityService } from "@modules/Core/services/EntityService";
import { PrismaService } from "@modules/Core/services/PrismaService";
import type { ContextOf } from "@src/types/ContextOf.ts";
import { Logger } from "@utils/Logger";

@EventController()
export default class ChannelSync {
	private logger = new Logger("ChannelSync");

	constructor(
		private readonly entityService: EntityService,
		private readonly prisma: PrismaService,
	) {}

	@On(BotEvents.ChannelCreate)
	async onCreate(
		@Client() _client: LeBotClient<true>,
		@Context() [channel]: ContextOf<typeof BotEvents.ChannelCreate>,
	) {
		if (channel.isDMBased()) return;

		try {
			await this.entityService.ensureChannel(channel);
		} catch (error) {
			this.logger.error(
				`Failed to sync created channel ${channel.id}: ${error}`,
			);
		}
	}

	@On(BotEvents.ChannelDelete)
	async onDelete(
		@Client() _client: LeBotClient<true>,
		@Context() [channel]: ContextOf<typeof BotEvents.ChannelDelete>,
	) {
		if (channel.isDMBased()) return;

		try {
			await this.prisma.channel.update({
				where: { id: channel.id },
				data: { deletedAt: new Date() },
			});
		} catch (error) {
			this.logger.error(
				`Failed to delete channel ${channel.id} from database: ${error}`,
			);
		}
	}

	@On(BotEvents.ChannelUpdate)
	async onUpdate(
		@Client() _client: LeBotClient<true>,
		@Context()
		[_oldChannel, newChannel]: ContextOf<typeof BotEvents.ChannelUpdate>,
	) {
		if (newChannel.isDMBased()) return;

		try {
			await this.entityService.ensureChannel(newChannel);
		} catch (error) {
			this.logger.error(
				`Failed to sync updated channel ${newChannel.id}: ${error}`,
			);
		}
	}
}
