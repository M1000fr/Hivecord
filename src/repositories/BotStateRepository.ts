import { Repository } from "@decorators/Repository";
import { BaseRepository } from "./BaseRepository";

@Repository()
export class BotStateRepository extends BaseRepository {
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
