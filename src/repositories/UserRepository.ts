import { Repository } from "@decorators/Repository";
import { BaseRepository } from "./BaseRepository";

@Repository()
export class UserRepository extends BaseRepository {
	async upsert(userId: string) {
		return this.prisma.user.upsert({
			where: { id: userId },
			update: { leftAt: null },
			create: { id: userId },
		});
	}

	async findById(userId: string) {
		return this.prisma.user.findUnique({
			where: { id: userId },
		});
	}
}
