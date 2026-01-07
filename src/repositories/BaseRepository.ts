import { Injectable } from "@decorators/Injectable";
import { PrismaService } from "@modules/Database/services/PrismaService";

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
    const guild = entity.guild || entity.Guild;

    if (!guild?.id || !guild?.name) return undefined;

    return {
      connectOrCreate: {
        where: { id: guild.id },
        create: {
          id: guild.id,
          name: guild.name,
        },
      },
    };
  }
}
