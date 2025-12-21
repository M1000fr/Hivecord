import { LeBotClient } from "@class/LeBotClient";
import { Client } from "@decorators/Client";
import { Event } from "@decorators/Event";
import { EventController } from "@decorators/EventController";
import { EventParam } from "@decorators/EventParam";
import { BotEvents } from "@enums/BotEvents";
import { prismaClient } from "@src/services/prismaService";
import { Logger } from "@utils/Logger";
import { type Channel } from "discord.js";

@EventController()
export default class ChannelDeleteEvent {
	private logger = new Logger("ChannelDeleteEvent");

	@Event({
		name: BotEvents.ChannelDelete,
	})
	async run(
		@Client() client: LeBotClient<true>,
		@EventParam() channel: Channel,
	) {
		if (channel.isDMBased()) return;

		try {
			await prismaClient.channel.updateMany({
				where: { id: channel.id },
				data: { deletedAt: new Date() },
			});
		} catch (error) {
			this.logger.error(
				`Failed to sync deleted channel ${channel.id}: ${error}`,
			);
		}
	}
}
