import { ChannelType } from "@prisma/client/enums";
import { prismaClient } from "@services/prismaService";
import { Logger } from "@utils/Logger";
import { ChannelType as DiscordChannelType, Guild } from "discord.js";

export class SyncService {
	private static logger = new Logger("SyncService");

	static async syncGuild(guild: Guild) {
		this.logger.log(`Syncing guild ${guild.name}...`);
		await this.syncGuildRecord(guild);
		await this.syncRoles(guild);
		await this.syncMembers(guild);
		await this.syncChannels(guild);
		this.logger.log(`Guild ${guild.name} synced.`);
	}

	static async syncGuildRecord(guild: Guild) {
		await prismaClient.guild.upsert({
			where: { id: guild.id },
			update: { name: guild.name },
			create: { id: guild.id, name: guild.name },
		});
	}

	static async syncRoles(guild: Guild) {
		const roles = await guild.roles.fetch();
		const roleIds = new Set(roles.keys());

		// 1. Upsert existing roles
		for (const [id, role] of roles) {
			await prismaClient.role.upsert({
				where: { id },
				update: {
					deletedAt: null,
				},
				create: {
					id,
					guildId: guild.id,
				},
			});
		}

		// 2. Mark missing roles as deleted
		const dbRoles = await prismaClient.role.findMany({
			where: { deletedAt: null },
			select: { id: true },
		});

		for (const dbRole of dbRoles) {
			if (!roleIds.has(dbRole.id)) {
				await prismaClient.role.update({
					where: { id: dbRole.id },
					data: { deletedAt: new Date() },
				});
				this.logger.log(`Marked role ${dbRole.id} as deleted.`);
			}
		}
	}

	static async syncMembers(guild: Guild) {
		const members = await guild.members.fetch();
		const memberIds = new Set(members.keys());

		// 1. Upsert existing members
		for (const [id, member] of members) {
			await prismaClient.user.upsert({
				where: { id },
				update: {
					leftAt: null,
				},
				create: {
					id,
				},
			});
		}

		// 2. Mark missing members as left
		const dbUsers = await prismaClient.user.findMany({
			where: { leftAt: null },
			select: { id: true },
		});

		for (const dbUser of dbUsers) {
			if (!memberIds.has(dbUser.id)) {
				await prismaClient.user.update({
					where: { id: dbUser.id },
					data: { leftAt: new Date() },
				});
				this.logger.log(`Marked user ${dbUser.id} as left.`);
			}
		}
	}

	static async syncChannels(guild: Guild) {
		const channels = await guild.channels.fetch();
		const channelIds = new Set<string>();

		// 1. Upsert existing channels
		for (const [id, channel] of channels) {
			if (!channel) continue;

			let type: ChannelType;
			if (channel.type === DiscordChannelType.GuildText) {
				type = ChannelType.TEXT;
			} else if (channel.type === DiscordChannelType.GuildVoice) {
				type = ChannelType.VOICE;
			} else if (channel.type === DiscordChannelType.GuildCategory) {
				type = ChannelType.CATEGORY;
			} else {
				continue;
			}

			channelIds.add(id);

			await prismaClient.channel.upsert({
				where: { id },
				update: { type, deletedAt: null },
				create: { id, type, guildId: guild.id },
			});
		}

		// 2. Mark missing channels as deleted
		const dbChannels = await prismaClient.channel.findMany({
			where: { deletedAt: null },
			select: { id: true },
		});

		for (const dbChannel of dbChannels) {
			if (!channelIds.has(dbChannel.id)) {
				await prismaClient.channel.update({
					where: { id: dbChannel.id },
					data: { deletedAt: new Date() },
				});
				this.logger.log(`Marked channel ${dbChannel.id} as deleted.`);
			}
		}
	}
}
