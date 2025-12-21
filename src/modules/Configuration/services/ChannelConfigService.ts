import { Injectable } from "@decorators/Injectable";
import { EntityService } from "@modules/Core/services/EntityService";
import { PrismaService } from "@modules/Core/services/PrismaService";
import { ChannelType } from "@prisma/client/enums";
import { ConfigCacheService } from "./ConfigCacheService";

@Injectable()
export class ChannelConfigService {
	constructor(
		private readonly entityService: EntityService,
		private readonly prisma: PrismaService,
		private readonly cache: ConfigCacheService,
	) {}

	async get(guildId: string, key: string): Promise<string | null> {
		return this.cache.get(guildId, "channel", key, async () => {
			const config = await this.prisma.channelConfiguration.findUnique({
				where: { key },
			});
			return config?.channelId ?? null;
		});
	}

	async set(
		guildId: string,
		key: string,
		channelId: string,
		channelType: ChannelType = ChannelType.TEXT,
	): Promise<void> {
		await this.entityService.ensureGuildById(guildId);
		await this.entityService.ensureChannelById(
			guildId,
			channelId,
			channelType,
		);

		await this.prisma.channelConfiguration.upsert({
			where: { key },
			update: { channelId },
			create: { key, channelId },
		});

		await this.cache.invalidate(guildId, key);
	}

	async getList(guildId: string, key: string): Promise<string[]> {
		return this.cache.get(guildId, "channels", key, async () => {
			const configs = await this.prisma.channelListConfiguration.findMany({
				where: {
					key,
					Channel: { guildId },
				},
			});
			return configs.map((c) => c.channelId);
		});
	}

	async addToList(
		guildId: string,
		key: string,
		channelId: string,
		channelType: ChannelType = ChannelType.TEXT,
	): Promise<void> {
		await this.entityService.ensureGuildById(guildId);
		await this.entityService.ensureChannelById(
			guildId,
			channelId,
			channelType,
		);

		await this.prisma.channelListConfiguration.upsert({
			where: { key_channelId: { key, channelId } },
			update: {},
			create: { key, channelId },
		});

		await this.cache.invalidate(guildId, key);
	}

	async removeFromList(
		guildId: string,
		key: string,
		channelId: string,
	): Promise<void> {
		try {
			await this.prisma.channelListConfiguration.delete({
				where: { key_channelId: { key, channelId } },
			});
			await this.cache.invalidate(guildId, key);
		} catch {
			// Ignore if not found
		}
	}

	async delete(guildId: string, key: string, _channelId: string): Promise<void> {
		try {
			await this.prisma.channelConfiguration.delete({
				where: { key },
			});
			await this.cache.invalidate(guildId, key);
		} catch {
			// Ignore if not found
		}
	}

	async clearList(guildId: string, key: string): Promise<void> {
		await this.prisma.channelListConfiguration.deleteMany({
			where: {
				key,
				Channel: { guildId },
			},
		});

		await this.cache.invalidate(guildId, key);
	}
}
