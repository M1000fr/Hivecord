import { LeBotClient } from "@class/LeBotClient";
import { Client } from "@decorators/Client";
import { Event } from "@decorators/Event";
import { EventController } from "@decorators/EventController";
import { EventParam } from "@decorators/EventParam";
import { BotEvents } from "@enums/BotEvents";
import { EntityService } from "@services/EntityService";
import type { PrismaService } from "@src/services/prismaService";
import { Logger } from "@utils/Logger";
import { GuildChannel } from "discord.js";

@EventController()
export default class ChannelSync {
	private logger = new Logger("ChannelSync");

	constructor(
		private readonly entityService: EntityService,
		private readonly prisma: PrismaService,
	) {}

	@Event({ name: BotEvents.ChannelCreate })
	async onCreate(
		@Client() _client: LeBotClient<true>,
		@EventParam() channel: GuildChannel,
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

	@Event({
		name: BotEvents.ChannelDelete,
	})
	async onDelete(
		@Client() _client: LeBotClient<true>,
		@EventParam() channel: GuildChannel,
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

	@Event({ name: BotEvents.ChannelUpdate })
	async onUpdate(
		@Client() _client: LeBotClient<true>,
		@EventParam() _oldChannel: GuildChannel,
		@EventParam() newChannel: GuildChannel,
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
