import { Injectable } from "@decorators/Injectable";
import { ChannelType } from "@prisma/client/enums";
import { ChannelRepository, ConfigurationRepository } from "@src/repositories";
import { Guild, GuildBasedChannel } from "discord.js";
import { ConfigCacheService } from "./ConfigCacheService";
import { GenericConfigService } from "./GenericConfigService";

/**
 * Configuration list item for channel configs
 */
interface ChannelConfigListItem {
  channelId: string;
  [key: string]: unknown;
}

/**
 * Configuration service for Channel-based configs.
 * Extends GenericConfigService with Channel-specific behavior.
 */
@Injectable()
export class ChannelConfigService extends GenericConfigService<GuildBasedChannel> {
  protected entityType = "channel" as const;
  protected listType = "channels" as const;
  private defaultChannelType: ChannelType = ChannelType.TEXT;

  constructor(
    private readonly channelRepository: ChannelRepository,
    private readonly configurationRepository: ConfigurationRepository,
    cache: ConfigCacheService,
  ) {
    super(cache);
  }

  override async set(
    guild: Guild,
    key: string,
    channel: GuildBasedChannel,
    channelType?: ChannelType,
  ): Promise<void> {
    if (channelType) {
      this.defaultChannelType = channelType;
    }
    await super.set(guild, key, channel);
  }

  override async addToList(
    guild: Guild,
    key: string,
    channel: GuildBasedChannel,
    channelType?: ChannelType,
  ): Promise<void> {
    if (channelType) {
      this.defaultChannelType = channelType;
    }
    await super.addToList(guild, key, channel);
  }

  protected async persistEntity(channel: GuildBasedChannel): Promise<void> {
    await this.channelRepository.upsert(channel, this.defaultChannelType);
  }

  protected extractId(channel: GuildBasedChannel): string {
    return channel.id;
  }

  protected extractListItemId(item: ChannelConfigListItem): string {
    return item.channelId;
  }

  protected async getConfigValue(key: string): Promise<string | null> {
    const config = await this.configurationRepository.getChannelConfig(key);
    return config?.channelId ?? null;
  }

  protected async setConfigValue(key: string, value: string): Promise<void> {
    await this.configurationRepository.upsertChannelConfig(key, value);
  }

  protected async getConfigListValues(
    guildId: string,
    key: string,
  ): Promise<ChannelConfigListItem[]> {
    return this.configurationRepository.getChannelListConfigs(guildId, key);
  }

  protected async setConfigListValues(
    guildId: string,
    key: string,
    values: string[],
  ): Promise<void> {
    await this.configurationRepository.setChannelList(guildId, key, values);
  }

  protected async addConfigListItem(key: string, value: string): Promise<void> {
    await this.configurationRepository.upsertChannelListConfig(key, value);
  }

  protected async removeConfigListItem(
    key: string,
    value: string,
  ): Promise<void> {
    await this.configurationRepository.deleteChannelListConfig(key, value);
  }

  protected async deleteConfigValue(key: string): Promise<void> {
    await this.configurationRepository.deleteChannelConfig(key);
  }

  protected async clearConfigList(guildId: string, key: string): Promise<void> {
    await this.configurationRepository.clearChannelList(guildId, key);
  }
}
