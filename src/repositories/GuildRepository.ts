import { Repository } from "@decorators/Repository";
import { BaseRepository } from "./BaseRepository";
import { Guild } from "discord.js";

@Repository()
export class GuildRepository extends BaseRepository {
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
