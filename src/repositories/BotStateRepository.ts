import { Repository } from "@decorators/Repository";
import { PrismaService } from "@modules/Core/services/PrismaService";
import { BaseRepository } from "./BaseRepository";

@Repository()
export class BotStateRepository extends BaseRepository {
	constructor(prisma: PrismaService) {
		super(prisma);
	}

	async get(key: string) {
		return this.prisma.botState.findUnique({
			where: { key },
		});
	}

	async upsert(key: string, value: string) {
		return this.prisma.botState.upsert({
			where: { key },
			update: { value, updatedAt: new Date() },
			create: { key, value },
		});
	}
}
