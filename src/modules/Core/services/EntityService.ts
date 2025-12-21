import { ChannelType } from "@prisma/client/enums";
import { Injectable } from "@src/decorators/Injectable";
import { ChannelRepository } from "@src/repositories/ChannelRepository";
import { GuildRepository } from "@src/repositories/GuildRepository";
import { RoleRepository } from "@src/repositories/RoleRepository";
import { UserRepository } from "@src/repositories/UserRepository";
import {
	ChannelType as DiscordChannelType,
	Guild,
	GuildChannel,
	Role,
	User,
} from "discord.js";

@Injectable()
export class EntityService {
	constructor(
		private readonly guildRepository: GuildRepository,
		private readonly userRepository: UserRepository,
		private readonly roleRepository: RoleRepository,
		private readonly channelRepository: ChannelRepository,
	) {}

	async ensureGuild(guild: Guild) {
		if (!guild || !guild.id) {
			throw new Error(
				`Invalid guild provided to ensureGuild: ${JSON.stringify(guild)}`,
			);
		}
		await this.guildRepository.upsert(guild.id, guild.name ?? "Unknown");
	}

	async ensureGuildById(guildId: string) {
		if (!guildId) {
			throw new Error(
				`Invalid guildId provided to ensureGuildById: ${guildId}`,
			);
		}
		await this.guildRepository.upsert(guildId, "Unknown");
	}

	async ensureUser(user: User) {
		await this.userRepository.upsert(user.id);
	}

	async ensureUserById(userId: string) {
		await this.userRepository.upsert(userId);
	}

	async ensureRole(role: Role) {
		await this.ensureGuild(role.guild);
		await this.roleRepository.upsert(role.id, role.guild.id);
	}

	async ensureRoleById(guildId: string, roleId: string) {
		await this.ensureGuildById(guildId);
		await this.roleRepository.upsert(roleId, guildId);
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
			type = ChannelType.TEXT;
		}

		await this.channelRepository.upsert(channel.id, channel.guild.id, type);
	}

	async ensureChannelById(
		guildId: string,
		channelId: string,
		type: ChannelType = ChannelType.TEXT,
	) {
		await this.ensureGuildById(guildId);
		await this.channelRepository.upsert(channelId, guildId, type);
	}
}
