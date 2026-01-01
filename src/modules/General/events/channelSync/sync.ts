import { LeBotClient } from "@class/LeBotClient";
import { EventController } from "@decorators/EventController";
import { On } from "@decorators/On";
import { Client } from "@decorators/params/Client";
import { Context } from "@decorators/params/Context";
import { BotEvents } from "@enums/BotEvents";
import { $Enums } from "@src/prisma/client/client";
import { ChannelRepository } from "@src/repositories";
import type { ContextOf } from "@src/types/ContextOf.ts";
import { Logger } from "@utils/Logger";
import { ChannelType } from "discord.js";

const CHANNEL_TYPE_MAP: Record<number, $Enums.ChannelType> = {
	[ChannelType.GuildText]: $Enums.ChannelType.TEXT,
	[ChannelType.GuildVoice]: $Enums.ChannelType.VOICE,
	[ChannelType.GuildCategory]: $Enums.ChannelType.CATEGORY,
};

@EventController()
export default class ChannelSync {
	private logger = new Logger("ChannelSync");

	constructor(private readonly channelRepository: ChannelRepository) {}

	@On(BotEvents.ChannelCreate)
	async onCreate(
		@Client() _client: LeBotClient<true>,
		@Context() [channel]: ContextOf<typeof BotEvents.ChannelCreate>,
	) {
		if (channel.isDMBased()) return;

		try {
			await this.channelRepository.upsert(
				channel,
				CHANNEL_TYPE_MAP[channel.type] ?? $Enums.ChannelType.TEXT,
			);
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
			await this.channelRepository.delete(channel);
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
			await this.channelRepository.upsert(
				newChannel,
				CHANNEL_TYPE_MAP[newChannel.type] ?? $Enums.ChannelType.TEXT,
			);
		} catch (error) {
			this.logger.error(
				`Failed to sync updated channel ${newChannel.id}: ${error}`,
			);
		}
	}
}
