import { Injectable } from "@decorators/Injectable";
import { PrismaService } from "@modules/Core/services/PrismaService";

export interface GuildRelation {
	id: string;
	name: string;
}

@Injectable()
export class BaseRepository {
	constructor(protected readonly prisma: PrismaService) {}

	/**
	 * Build Discord.js guild relationship for Prisma connectOrCreate
	 */
	protected buildGuildRelation(entity: {
		guild?: GuildRelation;
		Guild?: GuildRelation;
	}) {
		const guildId = entity.guild?.id || entity.Guild?.id;
		const guildName = entity.guild?.name || entity.Guild?.name;

		if (!guildId) return undefined;

		return {
			connectOrCreate: {
				where: { id: guildId },
				create: {
					id: guildId,
					name: guildName,
				},
			},
		};
	}
}
