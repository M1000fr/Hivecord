import { prismaClient } from "./prismaService";
import { ChannelType } from "../prisma/client/enums";

export class ConfigService {
	private static async ensureRoleExists(roleId: string): Promise<void> {
		await prismaClient.role.upsert({
			where: { id: roleId },
			update: {},
			create: { id: roleId },
		});
	}

	static async get(key: string): Promise<string | null> {
		const config = await prismaClient.configuration.findUnique({ where: { key } });
		return config?.value ?? null;
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
		const config = await prismaClient.channelConfiguration.findUnique({ where: { key } });
		return config?.channelId ?? null;
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
		const config = await prismaClient.roleConfiguration.findFirst({ where: { key } });
		return config?.roleId ?? null;
	}

	static async setRole(key: string, roleId: string): Promise<void> {
		await this.ensureRoleExists(roleId);
		await prismaClient.$transaction([
			prismaClient.roleConfiguration.deleteMany({ where: { key } }),
			prismaClient.roleConfiguration.create({ data: { key, roleId } }),
		]);
	}

	static async getRoles(key: string): Promise<string[]> {
		const configs = await prismaClient.roleConfiguration.findMany({
			where: { key },
		});
		return configs.map((c) => c.roleId);
	}

	static async setRoles(key: string, roleIds: string[]): Promise<void> {
		await prismaClient.$transaction(async (tx) => {
			await tx.roleConfiguration.deleteMany({ where: { key } });
			for (const roleId of roleIds) {
				await this.ensureRoleExists(roleId);
				await tx.roleConfiguration.create({ data: { key, roleId } });
			}
		});
	}

	static async addRole(key: string, roleId: string): Promise<void> {
		await this.ensureRoleExists(roleId);
		await prismaClient.roleConfiguration.upsert({
			where: { key_roleId: { key, roleId } },
			update: {},
			create: { key, roleId },
		});
	}

	static async removeRole(key: string, roleId: string): Promise<void> {
		try {
			await prismaClient.roleConfiguration.delete({ where: { key_roleId: { key, roleId } } });
		} catch {
			// Ignore if not found
		}
	}

	static async getAll(): Promise<Record<string, string>> {
		const [configs, channelConfigs, roleConfigs] = await Promise.all([
			prismaClient.configuration.findMany(),
			prismaClient.channelConfiguration.findMany(),
			prismaClient.roleConfiguration.findMany(),
		]);

		return {
			...Object.fromEntries(configs.map(c => [c.key, c.value])),
			...Object.fromEntries(channelConfigs.map(c => [c.key, c.channelId])),
			...Object.fromEntries(roleConfigs.map(c => [c.key, c.roleId])),
		};
	}
}
