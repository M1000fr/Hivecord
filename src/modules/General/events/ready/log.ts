import { LeBotClient } from "@class/LeBotClient";
import { Client } from "@decorators/Client";
import { Event } from "@decorators/Event";
import { EventController } from "@decorators/EventController";
import { BotEvents } from "@enums/BotEvents";
import { SyncService } from "@modules/General/services/SyncService";
import { Logger } from "@utils/Logger";

@EventController()
export default class ReadyEvent {
	private logger = new Logger("ReadyEvent");

	@Event({
		name: BotEvents.ClientReady,
		once: true,
	})
	async run(@Client() client: LeBotClient<true>) {
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
