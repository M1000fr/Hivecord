import { Repository } from "@decorators/Repository";
import { Role } from "discord.js";
import { BaseRepository } from "./BaseRepository";

@Repository()
export class RoleRepository extends BaseRepository {
	async upsert(role: Role, deletedAt: Date | null = null) {
		return this.prisma.role.upsert({
			where: { id: role.id },
			update: {
				Guild: {
					connectOrCreate: {
						where: { id: role.guild.id },
						create: {
							id: role.guild.id,
							name: role.guild.name,
						},
					},
				},
				deletedAt,
			},
			create: {
				id: role.id,
				Guild: {
					connectOrCreate: {
						where: { id: role.guild.id },
						create: {
							id: role.guild.id,
							name: role.guild.name,
						},
					},
				},
				deletedAt,
			},
		});
	}

	async delete(role: Role) {
		return this.prisma.role.upsert({
			where: { id: role.id },
			update: { deletedAt: new Date() },
			create: {
				id: role.id,
				Guild: {
					connectOrCreate: {
						where: { id: role.guild.id },
						create: {
							id: role.guild.id,
							name: role.guild.name,
						},
					},
				},
				deletedAt: new Date(),
			},
		});
	}
}
