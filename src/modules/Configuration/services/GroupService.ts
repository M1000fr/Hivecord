import type {
	GroupModel,
	PermissionModel,
	RoleModel,
} from "@prisma/client/models";
import { prismaClient } from "@services/prismaService";
import { RedisService } from "@services/RedisService";
import { Logger } from "@utils/Logger";

export class GroupService {
	private static logger = new Logger("GroupService");

	static async createGroup(
		name: string,
		roleId: string,
	): Promise<GroupModel> {
		// Check if role exists
		let role = await prismaClient.role.findUnique({
			where: { id: roleId },
		});
		if (!role) {
			role = await prismaClient.role.create({ data: { id: roleId } });
		}

		return prismaClient.group.create({
			data: {
				name,
				roleId,
			},
		});
	}

	static async deleteGroup(name: string): Promise<GroupModel> {
		const group = await prismaClient.group.findFirst({ where: { name } });
		if (!group) {
			throw new Error(`Group ${name} not found`);
		}

		const redis = RedisService.getInstance();
		await redis.del(`permissions:role:${group.roleId}`);

		return prismaClient.group.delete({
			where: { id: group.id },
		});
	}

	static async addPermission(
		groupName: string,
		permissionName: string,
	): Promise<void> {
		const group = await prismaClient.group.findFirst({
			where: { name: groupName },
		});
		if (!group) {
			throw new Error(`Group ${groupName} not found`);
		}

		const permission = await prismaClient.permission.findFirst({
			where: { name: permissionName },
		});
		if (!permission) {
			throw new Error(`Permission ${permissionName} not found`);
		}

		// Check if relation exists
		const existing = await prismaClient.groupPermission.findFirst({
			where: {
				groupId: group.id,
				permissionId: permission.id,
			},
		});

		if (!existing) {
			await prismaClient.groupPermission.create({
				data: {
					groupId: group.id,
					permissionId: permission.id,
				},
			});

			const redis = RedisService.getInstance();
			await redis.del(`permissions:role:${group.roleId}`);
		}
	}

	static async removePermission(
		groupName: string,
		permissionName: string,
	): Promise<void> {
		const group = await prismaClient.group.findFirst({
			where: { name: groupName },
		});
		if (!group) {
			throw new Error(`Group ${groupName} not found`);
		}

		const permission = await prismaClient.permission.findFirst({
			where: { name: permissionName },
		});
		if (!permission) {
			throw new Error(`Permission ${permissionName} not found`);
		}

		const groupPermission = await prismaClient.groupPermission.findFirst({
			where: {
				groupId: group.id,
				permissionId: permission.id,
			},
		});

		if (groupPermission) {
			await prismaClient.groupPermission.delete({
				where: { id: groupPermission.id },
			});

			const redis = RedisService.getInstance();
			await redis.del(`permissions:role:${group.roleId}`);
		}
	}

	static async listGroups(): Promise<
		(GroupModel & {
			Role: RoleModel;
			Permissions: { Permissions: PermissionModel }[];
		})[]
	> {
		return prismaClient.group.findMany({
			include: {
				Role: true,
				Permissions: {
					include: {
						Permissions: true,
					},
				},
			},
		});
	}

	static async getGroup(name: string): Promise<
		| (GroupModel & {
				Role: RoleModel;
				Permissions: { Permissions: PermissionModel }[];
		  })
		| null
	> {
		return prismaClient.group.findFirst({
			where: { name },
			include: {
				Role: true,
				Permissions: {
					include: {
						Permissions: true,
					},
				},
			},
		});
	}
}
