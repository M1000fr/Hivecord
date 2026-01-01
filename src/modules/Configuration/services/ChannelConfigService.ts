import { Injectable } from "@decorators/Injectable";
import { ChannelType } from "@prisma/client/enums";
import { ChannelRepository, ConfigurationRepository } from "@src/repositories";
import type { Channel, Guild, GuildBasedChannel } from "discord.js";
import { ConfigCacheService } from "./ConfigCacheService";

@Injectable()
export class ChannelConfigService {
	constructor(
		private readonly channelRepository: ChannelRepository,
		private readonly configurationRepository: ConfigurationRepository,
		private readonly cache: ConfigCacheService,
	) {}

	async get(guild: Guild, key: string): Promise<string | null> {
		return this.cache.get(guild.id, "channel", key, async () => {
			const config =
				await this.configurationRepository.getChannelConfig(key);
			return config?.channelId ?? null;
		});
	}

	async set(
		guild: Guild,
		key: string,
		channel: GuildBasedChannel,
		channelType: ChannelType = ChannelType.TEXT,
	): Promise<void> {
		await this.channelRepository.upsert(channel, channelType);

		await this.configurationRepository.upsertChannelConfig(key, channel.id);

		await this.cache.invalidate(guild.id, key);
	}

	async getList(guild: Guild, key: string): Promise<string[]> {
		return this.cache.get(guild.id, "channels", key, async () => {
			const configs =
				await this.configurationRepository.getChannelListConfigs(
					guild.id,
					key,
				);
			return configs.map((c) => c.channelId);
		});
	}

	async addToList(
		guild: Guild,
		key: string,
		channel: GuildBasedChannel,
		channelType: ChannelType = ChannelType.TEXT,
	): Promise<void> {
		await this.channelRepository.upsert(channel, channelType);

		await this.configurationRepository.upsertChannelListConfig(
			key,
			channel.id,
		);

		await this.cache.invalidate(guild.id, key);
	}

	async removeFromList(
		guild: Guild,
		key: string,
		channel: Channel,
	): Promise<void> {
		try {
			await this.configurationRepository.deleteChannelListConfig(
				key,
				channel.id,
			);
			await this.cache.invalidate(guild.id, key);
		} catch {
			// Ignore if not found
		}
	}

	async delete(guild: Guild, key: string, _channel: Channel): Promise<void> {
		try {
			await this.configurationRepository.deleteChannelConfig(key);
			await this.cache.invalidate(guild.id, key);
		} catch {
			// Ignore if not found
		}
	}

	async clearList(guild: Guild, key: string): Promise<void> {
		await this.configurationRepository.clearChannelList(guild.id, key);

		await this.cache.invalidate(guild.id, key);
	}
}
