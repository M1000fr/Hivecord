import { Injectable } from "@decorators/Injectable";
import { BaseRepository } from "./BaseRepository";

@Injectable()
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
