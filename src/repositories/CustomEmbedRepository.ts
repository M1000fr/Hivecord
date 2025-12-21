import { Repository } from "@decorators/Repository";
import type { APIEmbed } from "discord.js";
import { BaseRepository } from "./BaseRepository";

@Repository()
export class CustomEmbedRepository extends BaseRepository {
	async findByName(guildId: string, name: string) {
		return this.prisma.customEmbed.findUnique({
			where: { guildId_name: { guildId, name } },
		});
	}

	async upsert(guildId: string, name: string, data: APIEmbed) {
		return this.prisma.customEmbed.upsert({
			where: { guildId_name: { guildId, name } },
			update: { data: JSON.stringify(data) },
			create: { guildId, name, data: JSON.stringify(data) },
		});
	}

	async delete(guildId: string, name: string) {
		return this.prisma.customEmbed.delete({
			where: { guildId_name: { guildId, name } },
		});
	}

	async listNames(guildId: string) {
		const embeds = await this.prisma.customEmbed.findMany({
			where: { guildId },
			select: { name: true },
		});
		return embeds.map((e) => e.name);
	}
}
