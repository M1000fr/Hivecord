import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { BotEvents } from "@enums/BotEvents";
import { SyncService } from "@modules/General/services/SyncService";
import { Logger } from "@utils/Logger";

@Event({
	name: BotEvents.ClientReady,
	once: true,
})
export default class ReadyEvent extends BaseEvent<
	typeof BotEvents.ClientReady
> {
	private logger = new Logger("ReadyEvent");

	async run(client: LeBotClient<true>) {
		if (client.user) {
			this.logger.log(`Logged in as ${client.user.tag}!`);
		}
		await client.deployCommands();

		const guildId = process.env.DISCORD_GUILD_ID;
		if (guildId) {
			const guild = await client.guilds.fetch(guildId);
			if (guild) {
				await SyncService.syncGuild(guild);
			}
		}
	}
}
