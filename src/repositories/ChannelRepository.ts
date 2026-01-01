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
			where: {
				id: channel.id,
			},
			update: {
				type,
				deletedAt,
				Guild: {
					connectOrCreate: {
						where: { id: channel.guild.id },
						create: {
							id: channel.guild.id,
							name: channel.guild.name,
						},
					},
				},
			},
			create: {
				id: channel.id,
				type,
				Guild: {
					connectOrCreate: {
						where: { id: channel.guild.id },
						create: {
							id: channel.guild.id,
							name: channel.guild.name,
						},
					},
				},
			},
		});
	}

	async delete(channel: GuildBasedChannel) {
		return this.prisma.channel.upsert({
			where: { id: channel.id },
			update: { deletedAt: new Date() },
			create: {
				id: channel.id,
				guildId: channel.guild.id,
				type: ChannelType.TEXT, // Default type if not exists
				deletedAt: new Date(),
			},
		});
	}
}
