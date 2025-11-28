import { prismaClient } from "./prismaService";
import { ChannelType } from "../prisma/client/enums";

export class ConfigService {
	static async get(key: string): Promise<string | null> {
		const config = await prismaClient.configuration.findUnique({
			where: { key },
		});
		return config ? config.value : null;
	}

	static async set(key: string, value: string): Promise<void> {
		await prismaClient.configuration.upsert({
			where: { key },
			update: { value },
			create: { key, value },
		});
	}

	static async delete(key: string): Promise<void> {
		await prismaClient.configuration.delete({
			where: { key },
		});
	}

	static async getChannel(key: string): Promise<string | null> {
		const config = await prismaClient.channelConfiguration.findUnique({
			where: { key },
		});
		return config ? config.channelId : null;
	}

	static async setChannel(
		key: string,
		channelId: string,
		channelType: ChannelType = ChannelType.TEXT,
	): Promise<void> {
		await prismaClient.channel.upsert({
			where: { id: channelId },
			update: { type: channelType },
			create: { id: channelId, type: channelType },
		});

		await prismaClient.channelConfiguration.upsert({
			where: { key },
			update: { channelId },
			create: { key, channelId },
		});
	}

	static async getRole(key: string): Promise<string | null> {
		const config = await prismaClient.roleConfiguration.findFirst({
			where: { key },
		});
		return config ? config.roleId : null;
	}

	static async setRole(key: string, roleId: string): Promise<void> {
		await prismaClient.role.upsert({
			where: { id: roleId },
			update: {},
			create: { id: roleId },
		});

		await prismaClient.$transaction([
			prismaClient.roleConfiguration.deleteMany({ where: { key } }),
			prismaClient.roleConfiguration.create({
				data: { key, roleId },
			}),
		]);
	}

	static async getRoles(key: string): Promise<string[]> {
		const configs = await prismaClient.roleConfiguration.findMany({
			where: { key },
		});
		return configs.map((c) => c.roleId);
	}

	static async setRoles(
		key: string,
		roleIds: string[],
	): Promise<void> {
		await prismaClient.$transaction(async (tx) => {
			await tx.roleConfiguration.deleteMany({ where: { key } });

			for (const roleId of roleIds) {
				await tx.role.upsert({
					where: { id: roleId },
					update: {},
					create: { id: roleId },
				});
				await tx.roleConfiguration.create({
					data: { key, roleId },
				});
			}
		});
	}

	static async addRole(key: string, roleId: string): Promise<void> {
		await prismaClient.role.upsert({
			where: { id: roleId },
			update: {},
			create: { id: roleId },
		});

		await prismaClient.roleConfiguration.upsert({
			where: { key_roleId: { key, roleId } },
			update: {},
			create: { key, roleId },
		});
	}

	static async removeRole(
		key: string,
		roleId: string,
	): Promise<void> {
		try {
			await prismaClient.roleConfiguration.delete({
				where: { key_roleId: { key, roleId } },
			});
		} catch (e) {
			// Ignore if not found
		}
	}

	static async getAll(): Promise<Record<string, string>> {
		const configs = await prismaClient.configuration.findMany();
		const channelConfigs =
			await prismaClient.channelConfiguration.findMany();
		const roleConfigs = await prismaClient.roleConfiguration.findMany();

		const result: Record<string, string> = {};
		for (const config of configs) {
			result[config.key] = config.value;
		}
		for (const config of channelConfigs) {
			result[config.key] = config.channelId;
		}
		for (const config of roleConfigs) {
			result[config.key] = config.roleId;
		}
		return result;
	}
}
