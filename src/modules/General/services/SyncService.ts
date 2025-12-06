import { prismaClient } from "@services/prismaService";
import { Logger } from "@utils/Logger";
import { Guild } from "discord.js";

export class SyncService {
	private static logger = new Logger("SyncService");

	static async syncGuild(guild: Guild) {
		this.logger.log(`Syncing guild ${guild.name}...`);
		await this.syncGuildRecord(guild);
		this.logger.log(`Guild ${guild.name} synced.`);
	}

	static async syncGuildRecord(guild: Guild) {
		await prismaClient.guild.upsert({
			where: { id: guild.id },
			update: { name: guild.name },
			create: { id: guild.id, name: guild.name },
		});
	}
}
