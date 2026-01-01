import { Repository } from "@decorators/Repository";
import { BaseRepository } from "./BaseRepository";

@Repository()
export class PermissionRepository extends BaseRepository {
	async findGroupsByRoleId(roleId: string) {
		return this.prisma.group.findMany({
			where: { roleId },
			include: {
				Permissions: {
					include: {
						Permissions: true,
					},
				},
			},
		});
	}

	async findPermissionsByNames(names: string[]) {
		return this.prisma.permission.findMany({
			where: {
				name: { in: names },
			},
		});
	}

	async createManyPermissions(data: { name: string }[]) {
		return this.prisma.permission.createMany({
			data,
			skipDuplicates: true,
		});
	}

	async findAllPermissions() {
		return this.prisma.permission.findMany({
			select: { name: true },
			orderBy: { name: "asc" },
		});
	}
}
