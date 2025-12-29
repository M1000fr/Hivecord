import { Repository } from "@decorators/Repository";
import { Role } from "discord.js";
import { BaseRepository } from "./BaseRepository";

@Repository()
export class RoleRepository extends BaseRepository {
	async upsert(role: Role, deletedAt: Date | null = null) {
		return this.prisma.role.upsert({
			where: { id: role.id },
			update: { guildId: role.guild.id, deletedAt },
			create: { id: role.id, guildId: role.guild.id },
		});
	}

	async delete(role: Role) {
		return this.prisma.role.upsert({
			where: { id: role.id },
			update: { deletedAt: new Date() },
			create: {
				id: role.id,
				guildId: role.guild.id,
				deletedAt: new Date(),
			},
		});
	}
}
