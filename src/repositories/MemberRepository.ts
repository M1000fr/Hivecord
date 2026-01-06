import { Repository } from "@decorators/Repository";
import { GuildMember } from "discord.js";
import { BaseRepository } from "./BaseRepository";

@Repository()
export class MemberRepository extends BaseRepository {
	async upsert(member: GuildMember) {
		return this.prisma.member.upsert({
			where: {
				guildId_userId: {
					guildId: member.guild.id,
					userId: member.user.id,
				},
			},
			update: {},
			create: {
				User: {
					connectOrCreate: {
						where: { id: member.user.id },
						create: { id: member.user.id },
					},
				},
				Guild: this.buildGuildRelation({ guild: member.guild })!,
			},
		});
	}
}
