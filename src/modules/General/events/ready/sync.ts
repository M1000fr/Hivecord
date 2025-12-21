import { LeBotClient } from "@class/LeBotClient";
import { Client } from "@decorators/Client";
import { Event } from "@decorators/Event";
import { EventController } from "@decorators/EventController";
import { BotEvents } from "@enums/BotEvents";
import { SyncService } from "@modules/General/services/SyncService";

@EventController()
export default class ReadySyncEvent {
	@Event({
		name: BotEvents.ClientReady,
	})
	async run(@Client() client: LeBotClient<true>) {
		for (const guild of client.guilds.cache.values()) {
			await SyncService.syncGuild(guild);
		}
	}
}
