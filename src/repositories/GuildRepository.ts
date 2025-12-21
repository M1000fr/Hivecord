import { Injectable } from "@decorators/Injectable";
import { BaseRepository } from "./BaseRepository";

@Injectable()
export class GuildRepository extends BaseRepository {
	async upsert(guildId: string, name: string) {
		return this.prisma.guild.upsert({
			where: { id: guildId },
			update: { name },
			create: { id: guildId, name },
		});
	}

	async findById(guildId: string) {
		return this.prisma.guild.findUnique({
			where: { id: guildId },
		});
	}
}
