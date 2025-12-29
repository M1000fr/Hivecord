import { Repository } from "@decorators/Repository";
import { BaseRepository } from "./BaseRepository";
import { User } from "discord.js";

@Repository()
export class UserRepository extends BaseRepository {
	async upsert(user: User) {
		return this.prisma.user.upsert({
			where: { id: user.id },
			update: { leftAt: null },
			create: { id: user.id },
		});
	}

	async findById(user: User) {
		return this.prisma.user.findUnique({
			where: { id: user.id },
		});
	}
}
