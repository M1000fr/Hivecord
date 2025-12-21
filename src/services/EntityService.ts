import { ChannelType } from "@prisma/client/enums";
import { Injectable } from "@src/decorators/Injectable";
import {
	ChannelType as DiscordChannelType,
	Guild,
	GuildChannel,
	Role,
	User,
} from "discord.js";
import type { PrismaService } from "./prismaService";

@Injectable()
export class EntityService {
	constructor(private readonly prisma: PrismaService) {}

	async ensureGuild(guild: Guild) {
		if (!guild || !guild.id) {
			throw new Error(
				`Invalid guild provided to ensureGuild: ${JSON.stringify(guild)}`,
			);
		}
		await this.prisma.guild.upsert({
			where: { id: guild.id },
			update: { name: guild.name ?? "Unknown" },
			create: { id: guild.id, name: guild.name ?? "Unknown" },
		});
	}

	async ensureGuildById(guildId: string) {
		if (!guildId) {
			throw new Error(
				`Invalid guildId provided to ensureGuildById: ${guildId}`,
			);
		}
		await this.prisma.guild.upsert({
			where: { id: guildId },
			update: {},
			create: { id: guildId, name: "Unknown" },
		});
	}

	async ensureUser(user: User) {
		await this.prisma.user.upsert({
			where: { id: user.id },
			update: { leftAt: null },
			create: { id: user.id },
		});
	}

	async ensureUserById(userId: string) {
		await this.prisma.user.upsert({
			where: { id: userId },
			update: {},
			create: { id: userId },
		});
	}

	async ensureRole(role: Role) {
		await this.ensureGuild(role.guild);
		await this.prisma.role.upsert({
			where: { id: role.id },
			update: { deletedAt: null, guildId: role.guild.id },
			create: { id: role.id, guildId: role.guild.id },
		});
	}

	async ensureRoleById(guildId: string, roleId: string) {
		await this.ensureGuildById(guildId);
		await this.prisma.role.upsert({
			where: { id: roleId },
			update: { guildId },
			create: { id: roleId, guildId },
		});
	}

	async ensureChannel(channel: GuildChannel) {
		await this.ensureGuild(channel.guild);

		let type: ChannelType;
		if (channel.type === DiscordChannelType.GuildText) {
			type = ChannelType.TEXT;
		} else if (channel.type === DiscordChannelType.GuildVoice) {
			type = ChannelType.VOICE;
		} else if (channel.type === DiscordChannelType.GuildCategory) {
			type = ChannelType.CATEGORY;
		} else {
			// Default or skip? If we need to ensure it exists, we probably need a type.
			// Let's default to TEXT if unknown, or maybe we shouldn't ensure if it's not a supported type?
			// But if we are here, we likely need it.
			type = ChannelType.TEXT;
		}

		await this.prisma.channel.upsert({
			where: { id: channel.id },
			update: { type, deletedAt: null, guildId: channel.guild.id },
			create: { id: channel.id, type, guildId: channel.guild.id },
		});
	}

	async ensureChannelById(
		guildId: string,
		channelId: string,
		type: ChannelType = ChannelType.TEXT,
	) {
		await this.ensureGuildById(guildId);
		await this.prisma.channel.upsert({
			where: { id: channelId },
			update: { type, guildId },
			create: { id: channelId, type, guildId },
		});
	}
}
