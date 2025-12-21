import { Injectable } from "@decorators/Injectable";
import { BaseRepository } from "./BaseRepository";

@Injectable()
export class RoleRepository extends BaseRepository {
	async upsert(
		roleId: string,
		guildId: string,
		deletedAt: Date | null = null,
	) {
		return this.prisma.role.upsert({
			where: { id: roleId },
			update: { guildId, deletedAt },
			create: { id: roleId, guildId },
		});
	}

	async delete(roleId: string, guildId: string) {
		return this.prisma.role.upsert({
			where: { id: roleId },
			update: { deletedAt: new Date() },
			create: { id: roleId, guildId, deletedAt: new Date() },
		});
	}
}
