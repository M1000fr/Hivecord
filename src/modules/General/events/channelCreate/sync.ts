import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { BotEvents } from "@enums/BotEvents";
import { EntityService } from "@services/EntityService";
import { Logger } from "@utils/Logger";
import { type Channel, type GuildChannel } from "discord.js";

@Event({
	name: BotEvents.ChannelCreate,
})
export default class ChannelCreateEvent extends BaseEvent<
	typeof BotEvents.ChannelCreate
> {
	private logger = new Logger("ChannelCreateEvent");

	async run(client: LeBotClient<true>, channel: Channel) {
		if (channel.isDMBased()) return;

		try {
			await EntityService.ensureChannel(channel as GuildChannel);
		} catch (error) {
			this.logger.error(
				`Failed to sync created channel ${channel.id}: ${error}`,
			);
		}
	}
}
