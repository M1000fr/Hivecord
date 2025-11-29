import { prismaClient } from "@services/prismaService";
import { Logger } from '@utils/Logger';
import { RedisService } from "@services/RedisService";

const CACHE_TTL = 60; // 60 seconds

export class PermissionService {
	private static logger = new Logger("PermissionService");

	static async hasPermission(
		userId: string,
		userRoleIds: string[],
		requiredPermission: string,
	): Promise<boolean> {
		if (
			process.env.DISCORD_OWNER_ID &&
			userId === process.env.DISCORD_OWNER_ID
		) {
			return true;
		}

		const redis = RedisService.getInstance();

		for (const roleId of userRoleIds) {
			const cacheKey = `permissions:role:${roleId}`;
			let permissions: string[] = [];

			const cached = await redis.get(cacheKey);
			if (cached) {
				permissions = JSON.parse(cached);
			} else {
				const groups = await prismaClient.group.findMany({
					where: { roleId },
					include: {
						Permissions: {
							include: {
								Permissions: true,
							},
						},
					},
				});

				permissions = groups.flatMap((g) =>
					g.Permissions.map((gp) => gp.Permissions.name),
				);
				// Remove duplicates
				permissions = [...new Set(permissions)];

				await redis.set(cacheKey, JSON.stringify(permissions), "EX", CACHE_TTL);
			}

			if (this.checkPermission(permissions, requiredPermission)) {
				return true;
			}
		}

		return false;
	}

	private static checkPermission(
		userPermissions: string[],
		requiredPermission: string,
	): boolean {
		for (const permission of userPermissions) {
			if (permission === requiredPermission) return true;
			if (permission === "*") return true;

			if (permission.endsWith("*")) {
				const prefix = permission.slice(0, -1);
				if (requiredPermission.startsWith(prefix)) return true;
			}
		}
		return false;
	}

	static async registerPermissions(permissions: string[]) {
		if (permissions.length === 0) return;

		const permissionsToRegister = new Set<string>(permissions);

		// Generate wildcards
		for (const permission of permissions) {
			const parts = permission.split(".");
			// If permission is "a.b.c", we want "a.b.*" and "a.*"
			// We iterate from length-1 down to 1
			for (let i = parts.length - 1; i >= 1; i--) {
				const wildcard = parts.slice(0, i).join(".") + ".*";
				permissionsToRegister.add(wildcard);
			}
		}

		const finalPermissions = Array.from(permissionsToRegister);

		const existingPermissions = await prismaClient.permission.findMany({
			where: {
				name: {
					in: finalPermissions,
				},
			},
		});

		const existingPermissionNames = existingPermissions.map((p) => p.name);
		const newPermissions = finalPermissions.filter(
			(p) => !existingPermissionNames.includes(p),
		);

		if (newPermissions.length > 0) {
			await prismaClient.permission.createMany({
				data: newPermissions.map((name) => ({ name })),
				skipDuplicates: true,
			});
			this.logger.log(
				`Registered ${newPermissions.length} new permissions (including wildcards).`,
			);
		}
	}
}
