import { LeBotClient } from "@class/LeBotClient";
import { Client } from "@decorators/Client";
import { Event } from "@decorators/Event";
import { EventController } from "@decorators/EventController";
import { EventParam } from "@decorators/EventParam";
import { BotEvents } from "@enums/BotEvents";
import { $Enums } from "@src/prisma/client/client";
import { prismaClient } from "@src/services/prismaService";
import { Logger } from "@utils/Logger";
import {
	ChannelType as DiscordChannelType,
	type DMChannel,
	type NonThreadGuildBasedChannel,
} from "discord.js";

@EventController()
export default class ChannelUpdateEvent {
	private logger = new Logger("ChannelUpdateEvent");

	@Event({
		name: BotEvents.ChannelUpdate,
	})
	async run(
		@Client() client: LeBotClient<true>,
		@EventParam() oldChannel: NonThreadGuildBasedChannel | DMChannel,
		@EventParam() newChannel: NonThreadGuildBasedChannel | DMChannel,
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
				create: {
					id: newChannel.id,
					guildId: newChannel.guild.id,
					type,
				},
			});
		} catch (error) {
			this.logger.error(
				`Failed to sync updated channel ${newChannel.id}: ${error}`,
			);
		}
	}
}
