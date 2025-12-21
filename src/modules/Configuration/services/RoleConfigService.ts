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
			const config = await this.prisma.roleConfiguration.findFirst({
				where: {
					key,
					Role: { guildId },
				},
			});
			return config?.roleId ?? null;
		});
	}

	async set(guildId: string, key: string, roleId: string): Promise<void> {
		await this.ensureRoleExists(roleId, guildId);
		await this.prisma.$transaction([
			this.prisma.roleConfiguration.deleteMany({
				where: {
					key,
					Role: { guildId },
				},
			}),
			this.prisma.roleConfiguration.create({ data: { key, roleId } }),
		]);

		await this.cache.invalidate(guildId, key);
	}

	async getMany(guildId: string, key: string): Promise<string[]> {
		return this.cache.get(guildId, "roles", key, async () => {
			const configs = await this.prisma.roleConfiguration.findMany({
				where: {
					key,
					Role: { guildId },
				},
			});
			return configs.map((c) => c.roleId);
		});
	}

	async setMany(
		guildId: string,
		key: string,
		roleIds: string[],
	): Promise<void> {
		await this.prisma.$transaction(async (tx) => {
			await tx.roleConfiguration.deleteMany({
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
				await tx.roleConfiguration.create({ data: { key, roleId } });
			}
		});

		await this.cache.invalidate(guildId, key);
	}

	async add(guildId: string, key: string, roleId: string): Promise<void> {
		await this.ensureRoleExists(roleId, guildId);
		await this.prisma.roleConfiguration.upsert({
			where: { key_roleId: { key, roleId } },
			update: {},
			create: { key, roleId },
		});

		await this.cache.invalidate(guildId, key);
	}

	async remove(guildId: string, key: string, roleId: string): Promise<void> {
		try {
			await this.prisma.roleConfiguration.delete({
				where: { key_roleId: { key, roleId } },
			});
			await this.cache.invalidate(guildId, key);
		} catch {
			// Ignore if not found
		}
	}

	async delete(guildId: string, key: string): Promise<void> {
		await this.prisma.roleConfiguration.deleteMany({
			where: {
				key,
				Role: { guildId },
			},
		});

		await this.cache.invalidate(guildId, key);
	}
}
