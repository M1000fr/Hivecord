import { Injectable } from "@decorators/Injectable";
import { ConfigurationRepository, RoleRepository } from "@src/repositories";
import { Guild, Role } from "discord.js";
import { ConfigCacheService } from "./ConfigCacheService";

@Injectable()
export class RoleConfigService {
	constructor(
		private readonly roleRepository: RoleRepository,
		private readonly configurationRepository: ConfigurationRepository,
		private readonly cache: ConfigCacheService,
	) {}

	async get(guild: Guild, key: string): Promise<string | null> {
		return this.cache.get(guild.id, "role", key, async () => {
			const config = await this.configurationRepository.getRoleConfig(key);
			return config?.roleId ?? null;
		});
	}

	async set(guild: Guild, key: string, role: Role): Promise<void> {
		await this.roleRepository.upsert(role);
		await this.configurationRepository.upsertRoleConfig(key, role.id);

		await this.cache.invalidate(guild.id, key);
	}

	async getList(guild: Guild, key: string): Promise<string[]> {
		return this.cache.get(guild.id, "roles", key, async () => {
			const configs =
				await this.configurationRepository.getRoleListConfigs(
					guild.id,
					key,
				);
			return configs.map((c) => c.roleId);
		});
	}

	async setList(guild: Guild, key: string, roles: Role[]): Promise<void> {
		for (const role of roles) {
			await this.roleRepository.upsert(role);
		}

		await this.configurationRepository.setRoleList(
			guild.id,
			key,
			roles.map((r) => r.id),
		);

		await this.cache.invalidate(guild.id, key);
	}

	async addToList(guild: Guild, key: string, role: Role): Promise<void> {
		await this.roleRepository.upsert(role);
		await this.configurationRepository.upsertRoleListConfig(key, role.id);

		await this.cache.invalidate(guild.id, key);
	}

	async removeFromList(
		guild: Guild,
		key: string,
		roleId: string,
	): Promise<void> {
		try {
			await this.configurationRepository.deleteRoleListConfig(
				key,
				roleId,
			);
			await this.cache.invalidate(guild.id, key);
		} catch {
			// Ignore if not found
		}
	}

	async delete(guild: Guild, key: string, _roleId: string): Promise<void> {
		try {
			await this.configurationRepository.deleteRoleConfig(key);
			await this.cache.invalidate(guild.id, key);
		} catch {
			// Ignore if not found
		}
	}

	async clearList(guild: Guild, key: string): Promise<void> {
		await this.configurationRepository.clearRoleList(guild.id, key);

		await this.cache.invalidate(guild.id, key);
	}
}
