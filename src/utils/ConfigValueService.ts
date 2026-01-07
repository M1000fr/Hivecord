import { EConfigType } from "@decorators/ConfigProperty";
import { Injectable } from "@decorators/Injectable";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import { Guild, GuildBasedChannel, Role } from "discord.js";

/**
 * Handles configuration value persistence and retrieval.
 * Responsible for get/set/delete operations across all config types.
 */
@Injectable({ scope: "global" })
export class ConfigValueService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Convert camelCase to snake_case
   */
  static toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter, index) =>
      index === 0 ? letter.toLowerCase() : `_${letter.toLowerCase()}`,
    );
  }

  /**
   * Fetch a configuration value from the database
   */
  async fetchValue(
    guild: Guild,
    key: string,
    type: EConfigType | string,
  ): Promise<string | string[] | null> {
    const snakeKey = ConfigValueService.toSnakeCase(key);
    let value: string | string[] | null = null;

    if (type === EConfigType.Role)
      value = await this.configService.getRole(guild, snakeKey);
    else if (type === EConfigType.RoleArray)
      value = await this.configService.getRoleList(guild, snakeKey);
    else if (type === EConfigType.StringArray) {
      value = await this.configService.getMany(guild, snakeKey);
    } else if (type === EConfigType.Channel)
      value = await this.configService.getChannel(guild, snakeKey);
    else if (type === EConfigType.ChannelArray)
      value = await this.configService.getChannelList(guild, snakeKey);
    else value = await this.configService.get(guild, snakeKey);

    return value;
  }

  /**
   * Save a configuration value to the database
   */
  async saveValue(
    guild: Guild,
    key: string,
    value: string | string[],
    type: EConfigType | string,
  ): Promise<void> {
    const snakeKey = ConfigValueService.toSnakeCase(key);

    if (type === EConfigType.Role) {
      const role = await guild.roles.fetch(value as string);
      if (role) return this.configService.setRole(guild, snakeKey, role);
    }

    if (type === EConfigType.RoleArray) {
      const roles: Role[] = [];
      for (const id of value as string[]) {
        const role = await guild.roles.fetch(id);
        if (role) roles.push(role);
      }
      return this.configService.setRoleList(guild, snakeKey, roles);
    }

    if (type === EConfigType.StringArray) {
      return this.configService.setMany(guild, snakeKey, value as string[]);
    }

    if (type === EConfigType.Channel) {
      const channel = await guild.channels.fetch(value as string);
      if (channel)
        return this.configService.setChannel(guild, snakeKey, channel);
    }

    if (type === EConfigType.ChannelArray) {
      const channels: GuildBasedChannel[] = [];
      for (const id of value as string[]) {
        const channel = await guild.channels.fetch(id);
        if (channel) channels.push(channel);
      }
      return this.configService.setChannelList(guild, snakeKey, channels);
    }

    return this.configService.set(guild, snakeKey, value as string);
  }

  /**
   * Delete a configuration value from the database
   */
  async deleteValue(
    guild: Guild,
    key: string,
    type: EConfigType | string,
  ): Promise<void> {
    const snakeKey = ConfigValueService.toSnakeCase(key);
    if (type === EConfigType.Role || type === EConfigType.RoleArray)
      return this.configService.clearRoleList(guild, snakeKey);
    if (type === EConfigType.Channel || type === EConfigType.ChannelArray)
      return this.configService.clearChannelList(guild, snakeKey);
    return this.configService.delete(guild, snakeKey);
  }
}
