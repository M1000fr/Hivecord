import { Injectable } from "@decorators/Injectable";
import { ConfigurationRepository, RoleRepository } from "@src/repositories";
import { Role } from "discord.js";
import { ConfigCacheService } from "./ConfigCacheService";
import { GenericConfigService } from "./GenericConfigService";

/**
 * Configuration list item for role configs
 */
interface RoleConfigListItem {
  roleId: string;
  [key: string]: unknown;
}

/**
 * Configuration service for Role-based configs.
 * Extends GenericConfigService with Role-specific behavior.
 */
@Injectable()
export class RoleConfigService extends GenericConfigService<Role> {
  protected entityType = "role" as const;
  protected listType = "roles" as const;

  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly configurationRepository: ConfigurationRepository,
    cache: ConfigCacheService,
  ) {
    super(cache);
  }

  protected async persistEntity(role: Role): Promise<void> {
    await this.roleRepository.upsert(role);
  }

  protected extractId(role: Role): string {
    return role.id;
  }

  protected extractListItemId(item: RoleConfigListItem): string {
    return item.roleId;
  }

  protected async getConfigValue(key: string): Promise<string | null> {
    const config = await this.configurationRepository.getRoleConfig(key);
    return config?.roleId ?? null;
  }

  protected async setConfigValue(key: string, value: string): Promise<void> {
    await this.configurationRepository.upsertRoleConfig(key, value);
  }

  protected async getConfigListValues(
    guildId: string,
    key: string,
  ): Promise<RoleConfigListItem[]> {
    return this.configurationRepository.getRoleListConfigs(guildId, key);
  }

  protected async setConfigListValues(
    guildId: string,
    key: string,
    values: string[],
  ): Promise<void> {
    await this.configurationRepository.setRoleList(guildId, key, values);
  }

  protected async addConfigListItem(key: string, value: string): Promise<void> {
    await this.configurationRepository.upsertRoleListConfig(key, value);
  }

  protected async removeConfigListItem(
    key: string,
    value: string,
  ): Promise<void> {
    await this.configurationRepository.deleteRoleListConfig(key, value);
  }

  protected async deleteConfigValue(key: string): Promise<void> {
    await this.configurationRepository.deleteRoleConfig(key);
  }

  protected async clearConfigList(guildId: string, key: string): Promise<void> {
    await this.configurationRepository.clearRoleList(guildId, key);
  }
}
