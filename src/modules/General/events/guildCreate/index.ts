import { LeBotClient } from "@class/LeBotClient";
import { Client } from "@decorators/Client";
import { Event } from "@decorators/Event";
import { EventController } from "@decorators/EventController";
import { EventParam } from "@decorators/EventParam";
import { SyncService } from "@modules/General/services/SyncService";
import { Logger } from "@utils/Logger";
import { Events, Guild } from "discord.js";

@EventController()
export default class GuildCreateEvent {
	private logger = new Logger("GuildCreateEvent");

	@Event({
		name: Events.GuildCreate,
	})
	async run(@Client() client: LeBotClient<true>, @EventParam() guild: Guild) {
		this.logger.log(`Joined guild ${guild.name} (${guild.id})`);
		await SyncService.syncGuild(guild);
	}
}
