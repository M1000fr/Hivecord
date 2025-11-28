import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { prismaClient } from "@src/services/prismaService";
import { Logger } from "@utils/Logger";
import { Events, type Channel } from "discord.js";

@Event({
	name: Events.ChannelDelete,
})
export default class ChannelDeleteEvent extends BaseEvent<Events.ChannelDelete> {
	private logger = new Logger("ChannelDeleteEvent");

	async run(client: LeBotClient<true>, channel: Channel) {
		if (channel.isDMBased()) return;

		try {
			await prismaClient.channel.update({
				where: { id: channel.id },
				data: { deletedAt: new Date() },
			});
		} catch (error) {
			this.logger.error(`Failed to sync deleted channel ${channel.id}: ${error}`);
		}
	}
}
