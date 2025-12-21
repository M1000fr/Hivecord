import { LeBotClient } from "@class/LeBotClient";
import { EventController } from "@decorators/EventController";
import { On } from "@decorators/On";
import { Client } from "@decorators/params/Client";
import { Context } from "@decorators/params/Context";
import { SyncService } from "@modules/General/services/SyncService";
import type { ContextOf } from "@src/types/ContextOf";
import { Logger } from "@utils/Logger";
import { Events } from "discord.js";

@EventController()
export default class GuildSync {
	private logger = new Logger("GuildSync");

	constructor(private readonly syncService: SyncService) {}

	@On(Events.GuildCreate)
	async onCreate(
		@Client() client: LeBotClient<true>,
		@Context() [guild]: ContextOf<typeof Events.GuildCreate>,
	) {
		this.logger.log(`Joined guild ${guild.name} (${guild.id})`);
		await this.syncService.syncGuild(guild);
	}
}
