import { Injectable } from "@decorators/Injectable";
import { PrismaService } from "@modules/Core/services/PrismaService";
import { BaseRepository } from "./BaseRepository";

@Injectable()
export class GuildRepository extends BaseRepository {
	constructor(prisma: PrismaService) {
		super(prisma);
	}

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
