import { Injectable } from "@decorators/Injectable";
import { PrismaService } from "@modules/Core/services/PrismaService";
import { ChannelType } from "@prisma/client/enums";
import { BaseRepository } from "./BaseRepository";

@Injectable()
export class ChannelRepository extends BaseRepository {
	constructor(prisma: PrismaService) {
		super(prisma);
	}

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
