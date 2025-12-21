import { LeBotClient } from "@class/LeBotClient";
import { Client } from "@decorators/Client";
import { Context } from "@decorators/Context";
import { EventController } from "@decorators/EventController";
import { On } from "@decorators/On";
import { SyncService } from "@modules/General/services/SyncService";
import type { ContextOf } from "@src/types/ContextOf";
import { Logger } from "@utils/Logger";
import { Events } from "discord.js";

@EventController()
export default class GuildCreateEvent {
	private logger = new Logger("GuildCreateEvent");

	constructor(private readonly syncService: SyncService) {}

	@On(Events.GuildCreate)
	async run(
		@Client() client: LeBotClient<true>,
		@Context() [guild]: ContextOf<typeof Events.GuildCreate>,
	) {
		this.logger.log(`Joined guild ${guild.name} (${guild.id})`);
		await this.syncService.syncGuild(guild);
	}
}
