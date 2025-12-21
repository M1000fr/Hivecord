import { LeBotClient } from "@class/LeBotClient";
import { EventController } from "@decorators/EventController";
import { On } from "@decorators/On";
import { Client } from "@decorators/params/Client";
import { BotEvents } from "@enums/BotEvents";
import { SyncService } from "@modules/General/services/SyncService";

@EventController()
export default class ReadySyncEvent {
	constructor(private readonly syncService: SyncService) {}

	@On(BotEvents.ClientReady)
	async run(@Client() client: LeBotClient<true>) {
		for (const guild of client.guilds.cache.values()) {
			await this.syncService.syncGuild(guild);
		}
	}
}
