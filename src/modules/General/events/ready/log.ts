import { LeBotClient } from "@class/LeBotClient";
import { Client } from "@decorators/Client";
import { EventController } from "@decorators/EventController";
import { On } from "@decorators/On";
import { BotEvents } from "@enums/BotEvents";
import { SyncService } from "@modules/General/services/SyncService";
import { Logger } from "@utils/Logger";

@EventController()
export default class ReadyEvent {
	private logger = new Logger("ReadyEvent");

	constructor(private readonly syncService: SyncService) {}

	@On({ name: BotEvents.ClientReady, once: true })
	async run(@Client() client: LeBotClient<true>) {
		if (client.user) {
			this.logger.log(`Logged in as ${client.user.tag}!`);
		}
		await client.deployCommands();

		const guildId = process.env.DISCORD_GUILD_ID;
		if (guildId) {
			const guild = await client.guilds.fetch(guildId);
			if (guild) {
				await this.syncService.syncGuild(guild);
			}
		}
	}
}
