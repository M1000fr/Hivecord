import { Injectable } from "@decorators/Injectable";
import { ChannelType } from "@prisma/client/enums";
import { PrismaService } from "@services/PrismaService";

@Injectable()
export class BaseRepository {
	constructor(protected readonly prisma: PrismaService) {}
}

@Injectable()
export class GuildRepository extends BaseRepository {
	async upsert(guildId: string, name: string) {
		return this.prisma.guild.upsert({
			where: { id: guildId },
			update: { name },
			create: { id: guildId, name },
		});
	}

	async findById(guildId: string) {
		return this.prisma.guild.findUnique({
			where: { id: guildId },
		});
	}
}

@Injectable()
export class UserRepository extends BaseRepository {
	async upsert(userId: string) {
		return this.prisma.user.upsert({
			where: { id: userId },
			update: { leftAt: null },
			create: { id: userId },
		});
	}

	async findById(userId: string) {
		return this.prisma.user.findUnique({
			where: { id: userId },
		});
	}
}

@Injectable()
export class RoleRepository extends BaseRepository {
	async upsert(
		roleId: string,
		guildId: string,
		deletedAt: Date | null = null,
	) {
		return this.prisma.role.upsert({
			where: { id: roleId },
			update: { guildId, deletedAt },
			create: { id: roleId, guildId },
		});
	}

	async delete(roleId: string, guildId: string) {
		return this.prisma.role.upsert({
			where: { id: roleId },
			update: { deletedAt: new Date() },
			create: { id: roleId, guildId, deletedAt: new Date() },
		});
	}
}

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
