import { Repository } from "@decorators/Repository";
import type { PrismaService } from "@modules/Database/services/PrismaService";
import type { Guild } from "discord.js";
import { BaseRepository } from "./BaseRepository";

@Repository()
export class ConfigurationRepository extends BaseRepository {
	constructor(prisma: PrismaService) {
		super(prisma);
	}
	async get(guild: Guild, key: string) {
		return this.prisma.configuration.findFirst({
			where: { guildId: guild.id, key },
		});
	}

	async set(guild: Guild, key: string, value: string) {
		const config = await this.get(guild, key);
		if (config) {
			return this.prisma.configuration.update({
				where: { id: config.id },
				data: { value },
			});
		}
		return this.prisma.configuration.create({
			data: {
				guildId: guild.id,
				key,
				value,
			},
		});
	}

	async getMany(guild: Guild, key: string) {
		return this.prisma.configuration.findMany({
			where: { guildId: guild.id, key },
			orderBy: { id: "asc" },
		});
	}

	async setMany(guild: Guild, key: string, values: string[]) {
		await this.delete(guild, key);
		if (values.length > 0) {
			return this.prisma.configuration.createMany({
				data: values.map((value) => ({
					guildId: guild.id,
					key,
					value,
				})),
			});
		}
	}

	async delete(guild: Guild, key: string) {
		return this.prisma.configuration.deleteMany({
			where: { guildId: guild.id, key },
		});
	}

	// Role Configuration
	async getRoleConfig(key: string) {
		return this.prisma.roleConfiguration.findUnique({
			where: { key },
		});
	}

	async upsertRoleConfig(key: string, roleId: string) {
		return this.prisma.roleConfiguration.upsert({
			where: { key },
			update: { roleId },
			create: { key, roleId },
		});
	}

	async deleteRoleConfig(key: string) {
		return this.prisma.roleConfiguration.delete({
			where: { key },
		});
	}

	async getRoleListConfigs(guildId: string, key: string) {
		return this.prisma.roleListConfiguration.findMany({
			where: {
				key,
				Role: { guildId },
			},
		});
	}

	async deleteRoleListConfigs(guildId: string, key: string) {
		return this.prisma.roleListConfiguration.deleteMany({
			where: {
				key,
				Role: { guildId },
			},
		});
	}

	async createRoleListConfig(key: string, roleId: string) {
		return this.prisma.roleListConfiguration.create({
			data: { key, roleId },
		});
	}

	async upsertRoleListConfig(key: string, roleId: string) {
		return this.prisma.roleListConfiguration.upsert({
			where: { key_roleId: { key, roleId } },
			update: {},
			create: { key, roleId },
		});
	}

	async deleteRoleListConfig(key: string, roleId: string) {
		return this.prisma.roleListConfiguration.delete({
			where: { key_roleId: { key, roleId } },
		});
	}

	async clearRoleList(guildId: string, key: string) {
		return this.prisma.roleListConfiguration.deleteMany({
			where: {
				key,
				Role: { guildId },
			},
		});
	}

	async setRoleList(guildId: string, key: string, roleIds: string[]) {
		return this.prisma.$transaction(async (tx) => {
			await tx.roleListConfiguration.deleteMany({
				where: {
					key,
					Role: { guildId },
				},
			});
			if (roleIds.length > 0) {
				await tx.roleListConfiguration.createMany({
					data: roleIds.map((roleId) => ({ key, roleId })),
				});
			}
		});
	}

	// Channel Configuration
	async getChannelConfig(key: string) {
		return this.prisma.channelConfiguration.findUnique({
			where: { key },
		});
	}

	async upsertChannelConfig(key: string, channelId: string) {
		return this.prisma.channelConfiguration.upsert({
			where: { key },
			update: { channelId },
			create: { key, channelId },
		});
	}

	async getChannelListConfigs(guildId: string, key: string) {
		return this.prisma.channelListConfiguration.findMany({
			where: {
				key,
				Channel: { guildId },
			},
		});
	}

	async upsertChannelListConfig(key: string, channelId: string) {
		return this.prisma.channelListConfiguration.upsert({
			where: { key_channelId: { key, channelId } },
			update: {},
			create: { key, channelId },
		});
	}

	async setChannelList(guildId: string, key: string, channelIds: string[]) {
		return this.prisma.$transaction(async (tx) => {
			await tx.channelListConfiguration.deleteMany({
				where: {
					key,
					Channel: { guildId },
				},
			});
			if (channelIds.length > 0) {
				await tx.channelListConfiguration.createMany({
					data: channelIds.map((channelId) => ({ key, channelId })),
				});
			}
		});
	}

	async deleteChannelConfig(key: string) {
		return this.prisma.channelConfiguration.delete({
			where: { key },
		});
	}

	async deleteChannelListConfig(key: string, channelId: string) {
		return this.prisma.channelListConfiguration.delete({
			where: { key_channelId: { key, channelId } },
		});
	}

	async clearChannelList(guildId: string, key: string) {
		return this.prisma.channelListConfiguration.deleteMany({
			where: {
				key,
				Channel: { guildId },
			},
		});
	}

	async getAllConfigs(guildId: string) {
		const [
			configs,
			channelConfigs,
			channelListConfigs,
			roleConfigs,
			roleListConfigs,
		] = await Promise.all([
			this.prisma.configuration.findMany({
				where: { guildId },
			}),
			this.prisma.channelConfiguration.findMany({
				where: { Channel: { guildId } },
			}),
			this.prisma.channelListConfiguration.findMany({
				where: { Channel: { guildId } },
			}),
			this.prisma.roleConfiguration.findMany({
				where: { Role: { guildId } },
			}),
			this.prisma.roleListConfiguration.findMany({
				where: { Role: { guildId } },
			}),
		]);

		return {
			configs,
			channelConfigs,
			channelListConfigs,
			roleConfigs,
			roleListConfigs,
		};
	}
}
