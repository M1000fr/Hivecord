import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { SyncService } from "@modules/General/services/SyncService";
import { Logger } from "@utils/Logger";
import { Events, Guild } from "discord.js";

@Event({
	name: Events.GuildCreate,
})
export default class GuildCreateEvent extends BaseEvent<Events.GuildCreate> {
	private logger = new Logger("GuildCreateEvent");

	async run(client: LeBotClient<true>, guild: Guild) {
		this.logger.log(`Joined guild ${guild.name} (${guild.id})`);
		await SyncService.syncGuild(guild);
	}
}
