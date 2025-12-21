import { Injectable } from "@decorators/Injectable";
import { EntityService } from "@modules/Core/services/EntityService";
import { PrismaService } from "@modules/Core/services/PrismaService";
import { ConfigCacheService } from "./ConfigCacheService";

@Injectable()
export class RoleConfigService {
	constructor(
		private readonly entityService: EntityService,
		private readonly prisma: PrismaService,
		private readonly cache: ConfigCacheService,
	) {}

	private async ensureRoleExists(
		roleId: string,
		guildId: string,
	): Promise<void> {
		await this.entityService.ensureRoleById(guildId, roleId);
	}

	async get(guildId: string, key: string): Promise<string | null> {
		return this.cache.get(guildId, "role", key, async () => {
			const config = await this.prisma.roleConfiguration.findUnique({
				where: { key },
			});
			return config?.roleId ?? null;
		});
	}

	async set(guildId: string, key: string, roleId: string): Promise<void> {
		await this.ensureRoleExists(roleId, guildId);
		await this.prisma.roleConfiguration.upsert({
			where: { key },
			update: { roleId },
			create: { key, roleId },
		});

		await this.cache.invalidate(guildId, key);
	}

	async getList(guildId: string, key: string): Promise<string[]> {
		return this.cache.get(guildId, "roles", key, async () => {
			const configs = await this.prisma.roleListConfiguration.findMany({
				where: {
					key,
					Role: { guildId },
				},
			});
			return configs.map((c) => c.roleId);
		});
	}

	async setList(
		guildId: string,
		key: string,
		roleIds: string[],
	): Promise<void> {
		await this.prisma.$transaction(async (tx) => {
			await tx.roleListConfiguration.deleteMany({
				where: {
					key,
					Role: { guildId },
				},
			});
			for (const roleId of roleIds) {
				await tx.role.upsert({
					where: { id: roleId },
					update: { guildId },
					create: { id: roleId, guildId },
				});
				await tx.roleListConfiguration.create({ data: { key, roleId } });
			}
		});

		await this.cache.invalidate(guildId, key);
	}

	async addToList(guildId: string, key: string, roleId: string): Promise<void> {
		await this.ensureRoleExists(roleId, guildId);
		await this.prisma.roleListConfiguration.upsert({
			where: { key_roleId: { key, roleId } },
			update: {},
			create: { key, roleId },
		});

		await this.cache.invalidate(guildId, key);
	}

	async removeFromList(guildId: string, key: string, roleId: string): Promise<void> {
		try {
			await this.prisma.roleListConfiguration.delete({
				where: { key_roleId: { key, roleId } },
			});
			await this.cache.invalidate(guildId, key);
		} catch {
			// Ignore if not found
		}
	}

	async delete(guildId: string, key: string, _roleId: string): Promise<void> {
		try {
			await this.prisma.roleConfiguration.delete({
				where: { key },
			});
			await this.cache.invalidate(guildId, key);
		} catch {
			// Ignore if not found
		}
	}

	async clearList(guildId: string, key: string): Promise<void> {
		await this.prisma.roleListConfiguration.deleteMany({
			where: {
				key,
				Role: { guildId },
			},
		});

		await this.cache.invalidate(guildId, key);
	}
}
