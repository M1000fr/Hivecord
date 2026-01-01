import { Repository } from "@decorators/Repository";
import { User } from "discord.js";
import { BaseRepository } from "./BaseRepository";

@Repository()
export class UserRepository extends BaseRepository {
	async upsert(user: User) {
		return this.prisma.user.upsert({
			where: { id: user.id },
			update: {},
			create: { id: user.id },
		});
	}

	async findById(user: User) {
		return this.prisma.user.findUnique({
			where: { id: user.id },
		});
	}
}
