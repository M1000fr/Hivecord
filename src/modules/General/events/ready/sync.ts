import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { BotEvents } from "@enums/BotEvents";
import { SyncService } from "@modules/General/services/SyncService";

@Event({
	name: BotEvents.ClientReady,
})
export default class ReadySyncEvent extends BaseEvent<
	typeof BotEvents.ClientReady
> {
	async run(client: LeBotClient<true>) {
		for (const guild of client.guilds.cache.values()) {
			await SyncService.syncGuild(guild);
		}
	}
}
