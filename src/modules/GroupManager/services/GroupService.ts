import { GeneralConfigKeys } from "@modules/General/GeneralConfig";
import type {
	GroupModel,
	PermissionModel,
	RoleModel,
} from "@prisma/client/models";
import { ConfigService } from "@services/ConfigService";
import { I18nService } from "@services/I18nService";
import { prismaClient } from "@services/prismaService";
import { RedisService } from "@services/RedisService";
import { Logger } from "@utils/Logger";

export class GroupService {
	private static async getLanguage(): Promise<string> {
		return (await ConfigService.get(GeneralConfigKeys.language)) ?? "en";
	}

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
			const lng = await this.getLanguage();
			throw new Error(
				I18nService.t(
					"modules.configuration.services.group.not_found",
					{
						lng,
						name,
					},
				),
			);
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
			const lng = await this.getLanguage();
			throw new Error(
				I18nService.t(
					"modules.configuration.services.group.not_found",
					{
						lng,
						name: groupName,
					},
				),
			);
		}

		const permission = await prismaClient.permission.findFirst({
			where: { name: permissionName },
		});
		if (!permission) {
			const lng = await this.getLanguage();
			throw new Error(
				I18nService.t(
					"modules.configuration.services.permission.not_found",
					{
						lng,
						name: permissionName,
					},
				),
			);
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
			const lng = await this.getLanguage();
			throw new Error(
				I18nService.t(
					"modules.configuration.services.group.not_found",
					{
						lng,
						name: groupName,
					},
				),
			);
		}

		const permission = await prismaClient.permission.findFirst({
			where: { name: permissionName },
		});
		if (!permission) {
			const lng = await this.getLanguage();
			throw new Error(
				I18nService.t(
					"modules.configuration.services.permission.not_found",
					{
						lng,
						name: permissionName,
					},
				),
			);
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
