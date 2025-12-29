import { ChannelType } from "@prisma/client/enums";
import { Injectable } from "@src/decorators/Injectable";
import {
	ChannelRepository,
	GuildRepository,
	RoleRepository,
	UserRepository,
} from "@src/repositories";
import {
	ChannelType as DiscordChannelType,
	Guild,
	type GuildBasedChannel,
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
		await this.guildRepository.upsert(guild);
	}

	async ensureUser(user: User) {
		await this.userRepository.upsert(user);
	}

	async ensureRole(role: Role) {
		await this.ensureGuild(role.guild);
		await this.roleRepository.upsert(role);
	}

	async ensureChannel(channel: GuildBasedChannel) {
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

		await this.channelRepository.upsert(channel, type);
	}
}
