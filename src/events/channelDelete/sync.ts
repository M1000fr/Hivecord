import {
	Events,
	GuildChannel,
	ChannelType as DiscordChannelType,
} from "discord.js";
import { BaseEvent } from "../../class/BaseEvent";
import { Event } from "../../decorators/Event";
import { LeBotClient } from "../../class/LeBotClient";
import { prismaClient } from "../../services/prismaService";

@Event({
	name: Events.ChannelDelete,
})
export default class ChannelDeleteSync extends BaseEvent<Events.ChannelDelete> {
	async run(client: LeBotClient<true>, channel: GuildChannel) {
		if (!channel.guild) return;

		try {
			await prismaClient.channelConfiguration.deleteMany({
				where: { channelId: channel.id },
			});

			await prismaClient.channel.delete({
				where: { id: channel.id },
			});
		} catch (error) {
			// Channel might not exist in DB
		}
	}
}
