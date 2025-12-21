import { Injectable } from "@decorators/Injectable";
import { ChannelType } from "@prisma/client/enums";
import { BaseRepository } from "./BaseRepository";

@Injectable()
export class ChannelRepository extends BaseRepository {
	async upsert(
		channelId: string,
		guildId: string,
		type: ChannelType,
		deletedAt: Date | null = null,
	) {
		return this.prisma.channel.upsert({
			where: { id: channelId },
			update: { type, guildId, deletedAt },
			create: { id: channelId, type, guildId },
		});
	}
}
