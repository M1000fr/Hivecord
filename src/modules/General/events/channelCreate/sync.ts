import { LeBotClient } from "@class/LeBotClient";
import { Client } from "@decorators/Client";
import { Event } from "@decorators/Event";
import { EventController } from "@decorators/EventController";
import { EventParam } from "@decorators/EventParam";
import { BotEvents } from "@enums/BotEvents";
import { EntityService } from "@services/EntityService";
import { Logger } from "@utils/Logger";
import { type Channel, type GuildChannel } from "discord.js";

@EventController()
export default class ChannelCreateEvent {
	private logger = new Logger("ChannelCreateEvent");

	constructor(private readonly entityService: EntityService) {}

	@Event({ name: BotEvents.ChannelCreate })
	async run(
		@Client() client: LeBotClient<true>,
		@EventParam() channel: Channel,
	) {
		if (channel.isDMBased()) return;

		try {
			await this.entityService.ensureChannel(channel as GuildChannel);
		} catch (error) {
			this.logger.error(
				`Failed to sync created channel ${channel.id}: ${error}`,
			);
		}
	}

	@Event({ name: BotEvents.ChannelUpdate })
	async runUpdate(
		@Client() client: LeBotClient<true>,
		@EventParam() oldChannel: Channel,
		@EventParam() newChannel: Channel,
	) {
		console.log(oldChannel, newChannel);
	}
}
