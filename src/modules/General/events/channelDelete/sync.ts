import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { BotEvents } from "@enums/BotEvents";
import { prismaClient } from "@src/services/prismaService";
import { Logger } from "@utils/Logger";
import { type Channel } from "discord.js";

@Event({
	name: BotEvents.ChannelDelete,
})
export default class ChannelDeleteEvent extends BaseEvent<
	typeof BotEvents.ChannelDelete
> {
	private logger = new Logger("ChannelDeleteEvent");

	async run(client: LeBotClient<true>, channel: Channel) {
		if (channel.isDMBased()) return;

		try {
			await prismaClient.channel.update({
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
