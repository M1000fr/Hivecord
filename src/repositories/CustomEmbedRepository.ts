import { Repository } from "@decorators/Repository";
import type { APIEmbed, Guild } from "discord.js";
import { BaseRepository } from "./BaseRepository";

@Repository()
export class CustomEmbedRepository extends BaseRepository {
	async findByName(guild: Guild, name: string) {
		return this.prisma.customEmbed.findUnique({
			where: { guildId_name: { guildId: guild.id, name } },
		});
	}

	async upsert(guild: Guild, name: string, data: APIEmbed) {
		return this.prisma.customEmbed.upsert({
			where: {
				guildId_name: { guildId: guild.id, name },
			},
			update: {
				data: JSON.stringify(data),
			},
			create: {
				name,
				data: JSON.stringify(data),
				Guild: this.buildGuildRelation({ guild }),
			},
		});
	}

	async delete(guild: Guild, name: string) {
		return this.prisma.customEmbed.delete({
			where: { guildId_name: { guildId: guild.id, name } },
		});
	}

	async listNames(guild: Guild) {
		const embeds = await this.prisma.customEmbed.findMany({
			where: { guildId: guild.id },
			select: { name: true },
		});
		return embeds.map((e) => e.name);
	}
}
