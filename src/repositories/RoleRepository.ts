import { Repository } from "@decorators/Repository";
import { Role } from "discord.js";
import { SoftDeletableRepository } from "./SoftDeletableRepository";

/**
 * Repository for Role entities with soft-delete support.
 */
@Repository()
export class RoleRepository extends SoftDeletableRepository<Role> {
	protected entityType = "role";
	protected prismaModel = this.prisma.role;

	async upsert(role: Role, deletedAt: Date | null = null) {
		return this.softUpsert(role, {}, {}, deletedAt);
	}

	override async delete(role: Role) {
		return this.softUpsert(
			role,
			{ deletedAt: new Date() },
			{},
			new Date(),
		);
	}
}

