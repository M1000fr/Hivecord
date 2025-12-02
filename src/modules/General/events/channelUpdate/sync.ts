import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { BotEvents } from "@enums/BotEvents";
import { $Enums } from "@src/prisma/client/client";
import { prismaClient } from "@src/services/prismaService";
import { Logger } from "@utils/Logger";
import {
	ChannelType as DiscordChannelType,
	type DMChannel,
	type NonThreadGuildBasedChannel,
} from "discord.js";

@Event({
	name: BotEvents.ChannelUpdate,
})
export default class ChannelUpdateEvent extends BaseEvent<
	typeof BotEvents.ChannelUpdate
> {
	private logger = new Logger("ChannelUpdateEvent");

	async run(
		client: LeBotClient<true>,
		oldChannel: NonThreadGuildBasedChannel | DMChannel,
		newChannel: NonThreadGuildBasedChannel | DMChannel,
	) {
		if (newChannel.isDMBased()) return;

		let type: $Enums.ChannelType;
		if (newChannel.type === DiscordChannelType.GuildText) {
			type = $Enums.ChannelType.TEXT;
		} else if (newChannel.type === DiscordChannelType.GuildVoice) {
			type = $Enums.ChannelType.VOICE;
		} else if (newChannel.type === DiscordChannelType.GuildCategory) {
			type = $Enums.ChannelType.CATEGORY;
		} else {
			return;
		}

		try {
			await prismaClient.channel.upsert({
				where: { id: newChannel.id },
				update: { type, deletedAt: null },
				create: { id: newChannel.id, type },
			});
		} catch (error) {
			this.logger.error(
				`Failed to sync updated channel ${newChannel.id}: ${error}`,
			);
		}
	}
}
