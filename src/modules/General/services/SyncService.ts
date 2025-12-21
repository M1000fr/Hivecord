import { PrismaService } from "@services/PrismaService";
import { Injectable } from "@src/decorators/Injectable";
import { Logger } from "@utils/Logger";
import { Guild } from "discord.js";

@Injectable()
export class SyncService {
	private logger = new Logger("SyncService");

	constructor(private readonly prisma: PrismaService) {}

	async syncGuild(guild: Guild) {
		this.logger.log(`Syncing guild ${guild.name}...`);
		await this.syncGuildRecord(guild);
		this.logger.log(`Guild ${guild.name} synced.`);
	}

	async syncGuildRecord(guild: Guild) {
		await this.prisma.guild.upsert({
			where: { id: guild.id },
			update: { name: guild.name },
			create: { id: guild.id, name: guild.name },
		});
	}
}
