import { Injectable } from "@decorators/Injectable";
import { EntityService } from "@modules/Core/services/EntityService";
import { PrismaService } from "@modules/Core/services/PrismaService";
import { ChannelType } from "@prisma/client/enums";
import type { Guild, GuildBasedChannel } from "discord.js";
import { ConfigCacheService } from "./ConfigCacheService";

@Injectable()
export class ChannelConfigService {
	constructor(
		private readonly entityService: EntityService,
		private readonly prisma: PrismaService,
		private readonly cache: ConfigCacheService,
	) {}

	async get(guild: Guild, key: string): Promise<string | null> {
		return this.cache.get(guild.id, "channel", key, async () => {
			const config = await this.prisma.channelConfiguration.findUnique({
				where: { key },
			});
			return config?.channelId ?? null;
		});
	}

	async set(
		guild: Guild,
		key: string,
		channel: GuildBasedChannel,
		channelType: ChannelType = ChannelType.TEXT,
	): Promise<void> {
		await this.entityService.ensureGuild(guild);
		await this.entityService.ensureChannel(channel);

		await this.prisma.channelConfiguration.upsert({
			where: { key },
			update: {
				Channel: {
					connectOrCreate: {
						where: { id: channel.id },
						create: {
							id: channel.id,
							guildId: guild.id,
							type: channelType,
						},
					},
				},
			},
			create: {
				key,
				Channel: {
					connectOrCreate: {
						where: { id: channel.id },
						create: {
							id: channel.id,
							guildId: guild.id,
							type: channelType,
						},
					},
				},
			},
		});

		await this.cache.invalidate(guild.id, key);
	}

	async getList(guild: Guild, key: string): Promise<string[]> {
		return this.cache.get(guild.id, "channels", key, async () => {
			const configs = await this.prisma.channelListConfiguration.findMany(
				{
					where: {
						key,
						Channel: { guildId: guild.id },
					},
				},
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
		await this.entityService.ensureGuild(guild);
		await this.entityService.ensureChannel(channel);

		await this.prisma.channelListConfiguration.upsert({
			where: { key_channelId: { key, channelId: channel.id } },
			update: {
				Channel: {
					connectOrCreate: {
						where: { id: channel.id },
						create: {
							id: channel.id,
							guildId: guild.id,
							type: channelType,
						},
					},
				},
			},
			create: {
				key,
				Channel: {
					connectOrCreate: {
						where: { id: channel.id },
						create: {
							id: channel.id,
							guildId: guild.id,
							type: channelType,
						},
					},
				},
			},
		});

		await this.cache.invalidate(guild.id, key);
	}

	async removeFromList(
		guild: Guild,
		key: string,
		channelId: string,
	): Promise<void> {
		try {
			await this.prisma.channelListConfiguration.delete({
				where: { key_channelId: { key, channelId } },
			});
			await this.cache.invalidate(guild.id, key);
		} catch {
			// Ignore if not found
		}
	}

	async delete(
		guild: Guild,
		key: string,
		_channelId: string,
	): Promise<void> {
		try {
			await this.prisma.channelConfiguration.delete({
				where: { key },
			});
			await this.cache.invalidate(guild.id, key);
		} catch {
			// Ignore if not found
		}
	}

	async clearList(guild: Guild, key: string): Promise<void> {
		await this.prisma.channelListConfiguration.deleteMany({
			where: {
				key,
				Channel: { guildId: guild.id },
			},
		});

		await this.cache.invalidate(guild.id, key);
	}
}
