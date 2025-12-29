import { Repository } from "@decorators/Repository";
import { ChannelType } from "@prisma/client/enums";
import type { GuildBasedChannel } from "discord.js";
import { BaseRepository } from "./BaseRepository";

@Repository()
export class ChannelRepository extends BaseRepository {
	async upsert(
		channel: GuildBasedChannel,
		type: ChannelType,
		deletedAt: Date | null = null,
	) {
		return this.prisma.channel.upsert({
			where: { id: channel.id },
			update: { type, guildId: channel.guild.id, deletedAt },
			create: { id: channel.id, type, guildId: channel.guild.id },
		});
	}
}
