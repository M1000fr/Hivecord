import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { $Enums } from "@src/prisma/client/client";
import { prismaClient } from "@src/services/prismaService";
import { Logger } from "@utils/Logger";
import { ChannelType as DiscordChannelType, type Channel } from "discord.js";
import { BotEvents } from "@enums/BotEvents";

@Event({
	name: BotEvents.ChannelCreate,
})
export default class ChannelCreateEvent extends BaseEvent<
	typeof BotEvents.ChannelCreate
> {
	private logger = new Logger("ChannelCreateEvent");

	async run(client: LeBotClient<true>, channel: Channel) {
		if (channel.isDMBased()) return;

		let type: $Enums.ChannelType;
		if (channel.type === DiscordChannelType.GuildText) {
			type = $Enums.ChannelType.TEXT;
		} else if (channel.type === DiscordChannelType.GuildVoice) {
			type = $Enums.ChannelType.VOICE;
		} else if (channel.type === DiscordChannelType.GuildCategory) {
			type = $Enums.ChannelType.CATEGORY;
		} else {
			return;
		}

		try {
			await prismaClient.channel.create({
				data: {
					id: channel.id,
					type,
				},
			});
		} catch (error) {
			this.logger.error(
				`Failed to sync created channel ${channel.id}: ${error}`,
			);
		}
	}
}
