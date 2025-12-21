import { Service } from "@decorators/Service";
import type {
	GroupModel,
	PermissionModel,
	RoleModel,
} from "@prisma/client/models";
import { ConfigService } from "@services/ConfigService";
import { EntityService } from "@services/EntityService";
import { I18nService } from "@services/I18nService";
import { prismaClient } from "@services/prismaService";
import { RedisService } from "@services/RedisService";
import { GeneralConfig } from "@src/modules/General/GeneralConfig";
import { Logger } from "@utils/Logger";
import { Guild } from "discord.js";

@Service()
export class GroupService {
	private static async getLanguage(guildId: string): Promise<string> {
		return (
			(await ConfigService.of(guildId, GeneralConfig).generalLanguage) ||
			"en"
		);
	}

	private static logger = new Logger("GroupService");

	static async createGroup(
		guild: Guild,
		name: string,
		roleId: string,
	): Promise<GroupModel> {
		await EntityService.ensureGuild(guild);
		const guildId = guild.id;
		// Check if role exists
		await EntityService.ensureRoleById(guildId, roleId);

		return prismaClient.group.create({
			data: {
				guildId,
				name,
				roleId,
			},
		});
	}

	static async deleteGroup(
		guildId: string,
		name: string,
	): Promise<GroupModel> {
		const group = await prismaClient.group.findFirst({
			where: { name, guildId },
		});
		if (!group) {
			const lng = await this.getLanguage(guildId);
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
		guildId: string,
		groupName: string,
		permissionName: string,
	): Promise<void> {
		const group = await prismaClient.group.findFirst({
			where: { name: groupName, guildId },
		});
		if (!group) {
			const lng = await this.getLanguage(guildId);
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
			const lng = await this.getLanguage(guildId);
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
		guildId: string,
		groupName: string,
		permissionName: string,
	): Promise<void> {
		const group = await prismaClient.group.findFirst({
			where: { name: groupName, guildId },
		});
		if (!group) {
			const lng = await this.getLanguage(guildId);
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
			const lng = await this.getLanguage(guildId);
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

	static async listGroups(guildId: string): Promise<
		(GroupModel & {
			Role: RoleModel;
			Permissions: { Permissions: PermissionModel }[];
		})[]
	> {
		return prismaClient.group.findMany({
			where: { guildId },
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

	static async getGroup(
		guildId: string,
		name: string,
	): Promise<
		| (GroupModel & {
				Role: RoleModel;
				Permissions: { Permissions: PermissionModel }[];
		  })
		| null
	> {
		return prismaClient.group.findFirst({
			where: { name, guildId },
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

	static async getGroupById(id: number): Promise<
		| (GroupModel & {
				Role: RoleModel;
				Permissions: { Permissions: PermissionModel }[];
		  })
		| null
	> {
		return prismaClient.group.findUnique({
			where: { id },
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

	static async updatePermissions(
		groupId: number,
		permissionsToAdd: string[],
		permissionsToRemove: string[],
	): Promise<void> {
		const group = await prismaClient.group.findUnique({
			where: { id: groupId },
		});
		if (!group) return;

		// Add permissions
		for (const permName of permissionsToAdd) {
			const permission = await prismaClient.permission.findFirst({
				where: { name: permName },
			});
			if (!permission) continue;

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
			}
		}

		// Remove permissions
		for (const permName of permissionsToRemove) {
			const permission = await prismaClient.permission.findFirst({
				where: { name: permName },
			});
			if (!permission) continue;

			const existing = await prismaClient.groupPermission.findFirst({
				where: {
					groupId: group.id,
					permissionId: permission.id,
				},
			});

			if (existing) {
				await prismaClient.groupPermission.delete({
					where: { id: existing.id },
				});
			}
		}

		const redis = RedisService.getInstance();
		await redis.del(`permissions:role:${group.roleId}`);
	}
}
