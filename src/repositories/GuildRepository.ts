import { Repository } from "@decorators/Repository";
import { PrismaService } from "@modules/Database/services/PrismaService";
import { Guild } from "discord.js";
import { BaseRepository } from "./BaseRepository";

@Repository()
export class GuildRepository extends BaseRepository {
	constructor(prisma: PrismaService) {
		super(prisma);
	}

	async upsert(guild: Guild) {
		return this.prisma.guild.upsert({
			where: { id: guild.id },
			update: { name: guild.name },
			create: { id: guild.id, name: guild.name },
		});
	}

	async findById(guild: Guild) {
		return this.prisma.guild.findUnique({
			where: { id: guild.id },
		});
	}
}
