import { Injectable } from "@decorators/Injectable";
import { EntityService } from "@modules/Core/services/EntityService";
import { PrismaService } from "@modules/Core/services/PrismaService";
import { Guild, Role } from "discord.js";
import { ConfigCacheService } from "./ConfigCacheService";

@Injectable()
export class RoleConfigService {
	constructor(
		private readonly entityService: EntityService,
		private readonly prisma: PrismaService,
		private readonly cache: ConfigCacheService,
	) {}

	async get(guild: Guild, key: string): Promise<string | null> {
		return this.cache.get(guild.id, "role", key, async () => {
			const config = await this.prisma.roleConfiguration.findUnique({
				where: { key },
			});
			return config?.roleId ?? null;
		});
	}

	async set(guild: Guild, key: string, role: Role): Promise<void> {
		await this.entityService.ensureRole(role);
		await this.prisma.roleConfiguration.upsert({
			where: { key },
			update: { roleId: role.id },
			create: { key, roleId: role.id },
		});

		await this.cache.invalidate(guild.id, key);
	}

	async getList(guild: Guild, key: string): Promise<string[]> {
		return this.cache.get(guild.id, "roles", key, async () => {
			const configs = await this.prisma.roleListConfiguration.findMany({
				where: {
					key,
					Role: { guildId: guild.id },
				},
			});
			return configs.map((c) => c.roleId);
		});
	}

	async setList(
		guild: Guild,
		key: string,
		roles: Role[],
	): Promise<void> {
		for (const role of roles) {
			await this.entityService.ensureRole(role);
		}

		await this.prisma.$transaction(async (tx) => {
			await tx.roleListConfiguration.deleteMany({
				where: {
					key,
					Role: { guildId: guild.id },
				},
			});
			for (const role of roles) {
				await tx.roleListConfiguration.create({
					data: { key, roleId: role.id },
				});
			}
		});

		await this.cache.invalidate(guild.id, key);
	}

	async addToList(
		guild: Guild,
		key: string,
		role: Role,
	): Promise<void> {
		await this.entityService.ensureRole(role);
		await this.prisma.roleListConfiguration.upsert({
			where: { key_roleId: { key, roleId: role.id } },
			update: {},
			create: { key, roleId: role.id },
		});

		await this.cache.invalidate(guild.id, key);
	}

	async removeFromList(
		guild: Guild,
		key: string,
		roleId: string,
	): Promise<void> {
		try {
			await this.prisma.roleListConfiguration.delete({
				where: { key_roleId: { key, roleId } },
			});
			await this.cache.invalidate(guild.id, key);
		} catch {
			// Ignore if not found
		}
	}

	async delete(guild: Guild, key: string, _roleId: string): Promise<void> {
		try {
			await this.prisma.roleConfiguration.delete({
				where: { key },
			});
			await this.cache.invalidate(guild.id, key);
		} catch {
			// Ignore if not found
		}
	}

	async clearList(guild: Guild, key: string): Promise<void> {
		await this.prisma.roleListConfiguration.deleteMany({
			where: {
				key,
				Role: { guildId: guild.id },
			},
		});

		await this.cache.invalidate(guild.id, key);
	}
}
