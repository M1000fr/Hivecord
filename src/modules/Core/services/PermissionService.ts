import { Injectable } from "@decorators/Injectable";
import { PermissionRepository } from "@src/repositories";
import { Logger } from "@utils/Logger";
import { RedisService } from "./RedisService";

const CACHE_TTL = 60; // 60 seconds

@Injectable()
export class PermissionService {
	private logger = new Logger("PermissionService");

	constructor(
		private readonly permissionRepository: PermissionRepository,
		private readonly redis: RedisService,
	) {}

	async hasPermission(
		userId: string,
		guildOwnerId: string | undefined,
		userRoleIds: string[],
		requiredPermission: string,
	): Promise<boolean> {
		if (guildOwnerId && userId === guildOwnerId) {
			return true;
		}

		const redis = this.redis.client;

		for (const roleId of userRoleIds) {
			const cacheKey = `permissions:role:${roleId}`;
			let permissions: string[] = [];

			const cached = await redis.get(cacheKey);
			if (cached) {
				permissions = JSON.parse(cached);
			} else {
				const groups =
					await this.permissionRepository.findGroupsByRoleId(roleId);

				permissions = groups.flatMap((g) =>
					g.Permissions.map((gp) => gp.Permissions.name),
				);
				// Remove duplicates
				permissions = [...new Set(permissions)];

				await redis.set(
					cacheKey,
					JSON.stringify(permissions),
					"EX",
					CACHE_TTL,
				);
			}

			if (this.checkPermission(permissions, requiredPermission)) {
				return true;
			}
		}

		return false;
	}

	private checkPermission(
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

	async registerPermissions(permissions: string[]) {
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

		const existingPermissions =
			await this.permissionRepository.findPermissionsByNames(
				finalPermissions,
			);

		const existingPermissionNames = existingPermissions.map((p) => p.name);
		const newPermissions = finalPermissions.filter(
			(p) => !existingPermissionNames.includes(p),
		);

		if (newPermissions.length > 0) {
			await this.permissionRepository.createManyPermissions(
				newPermissions.map((name) => ({ name })),
			);
			this.logger.log(
				`Registered ${newPermissions.length} new permissions (including wildcards).`,
			);
		}
	}

	async getAllPermissions(): Promise<string[]> {
		const permissions =
			await this.permissionRepository.findAllPermissions();
		return permissions.map((p) => p.name);
	}
}
