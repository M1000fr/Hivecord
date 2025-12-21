import { Service } from "@decorators/Service";
import { SanctionType, type SanctionReason } from "@prisma/client/client";
import { prismaClient as prisma } from "@services/prismaService";

@Service()
export class SanctionReasonService {
	static async create(
		guildId: string,
		data: {
			text: string;
			type: SanctionType;
			duration?: string;
			isSystem?: boolean;
			key?: string;
		},
	): Promise<SanctionReason> {
		return prisma.sanctionReason.create({
			data: {
				guildId,
				text: data.text,
				type: data.type,
				duration: data.duration,
				isSystem: data.isSystem ?? false,
				key: data.key,
			},
		});
	}

	static async update(
		id: number,
		data: Partial<Omit<SanctionReason, "id">>,
	): Promise<SanctionReason> {
		return prisma.sanctionReason.update({
			where: { id },
			data,
		});
	}

	static async delete(id: number): Promise<SanctionReason> {
		return prisma.sanctionReason.delete({
			where: { id },
		});
	}

	static async getAll(guildId: string): Promise<SanctionReason[]> {
		return prisma.sanctionReason.findMany({ where: { guildId } });
	}

	static async getByType(
		guildId: string,
		type: SanctionType,
		includeSystem: boolean = false,
	): Promise<SanctionReason[]> {
		return prisma.sanctionReason.findMany({
			where: {
				guildId,
				type,
				isSystem: includeSystem ? undefined : false,
			},
		});
	}

	static async getByKey(
		guildId: string,
		key: string,
	): Promise<SanctionReason | null> {
		return prisma.sanctionReason.findUnique({
			where: {
				guildId_key: {
					guildId,
					key,
				},
			},
		});
	}

	static async getById(id: number): Promise<SanctionReason | null> {
		return prisma.sanctionReason.findUnique({
			where: { id },
		});
	}

	static async getOrCreateSystemReason(
		guildId: string,
		key: string,
		defaultText: string,
		type: SanctionType,
		duration?: string,
	): Promise<SanctionReason> {
		let reason = await prisma.sanctionReason.findUnique({
			where: {
				guildId_key: {
					guildId,
					key,
				},
			},
		});

		if (!reason) {
			reason = await prisma.sanctionReason.create({
				data: {
					guildId,
					key,
					text: defaultText,
					type,
					duration,
					isSystem: true,
				},
			});
		}

		return reason;
	}
}
