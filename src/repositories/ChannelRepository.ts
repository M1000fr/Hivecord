import { Repository } from "@decorators/Repository";
import { PrismaService } from "@modules/Database/services/PrismaService";
import { ChannelType } from "@prisma/client/enums";
import { type GuildBasedChannel } from "discord.js";
import { SoftDeletableRepository } from "./SoftDeletableRepository";

/**
 * Repository for Channel entities with soft-delete support.
 */
@Repository()
export class ChannelRepository extends SoftDeletableRepository<GuildBasedChannel> {
	protected entityType = "channel";
	protected prismaModel;

	constructor(prisma: PrismaService) {
		super(prisma);
		this.prismaModel = this.prisma.channel;
	}

	async upsert(
		channel: GuildBasedChannel,
		type: ChannelType,
		deletedAt: Date | null = null,
	) {
		return this.softUpsert(channel, { type }, { type }, deletedAt);
	}

	override async delete(channel: GuildBasedChannel) {
		return this.softUpsert(
			channel,
			{ deletedAt: new Date() },
			{ type: ChannelType.TEXT },
			new Date(),
		);
	}
}
