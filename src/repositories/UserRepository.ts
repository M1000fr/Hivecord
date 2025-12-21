import { Injectable } from "@decorators/Injectable";
import { PrismaService } from "@modules/Core/services/PrismaService";
import { BaseRepository } from "./BaseRepository";

@Injectable()
export class UserRepository extends BaseRepository {
	constructor(prisma: PrismaService) {
		super(prisma);
	}

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
