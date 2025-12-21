import { Injectable } from "@src/decorators/Injectable";
import { GuildRepository } from "@src/repositories";
import { Logger } from "@utils/Logger";
import { Guild } from "discord.js";

@Injectable()
export class SyncService {
	private logger = new Logger("SyncService");

	constructor(private readonly guildRepository: GuildRepository) {}

	async syncGuild(guild: Guild) {
		this.logger.log(`Syncing guild ${guild.name}...`);
		await this.syncGuildRecord(guild);
		this.logger.log(`Guild ${guild.name} synced.`);
	}

	async syncGuildRecord(guild: Guild) {
		await this.guildRepository.upsert(guild.id, guild.name);
	}
}
