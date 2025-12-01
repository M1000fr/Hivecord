import { prismaClient as prisma } from "@services/prismaService";
import { SanctionType, type SanctionReason } from "@prisma/client/client";

export class SanctionReasonService {
    static async create(data: {
        text: string;
        type: SanctionType;
        duration?: string;
        isSystem?: boolean;
        key?: string;
    }): Promise<SanctionReason> {
        return prisma.sanctionReason.create({
            data: {
                text: data.text,
                type: data.type,
                duration: data.duration,
                isSystem: data.isSystem ?? false,
                key: data.key,
            },
        });
    }

    static async update(id: number, data: Partial<Omit<SanctionReason, "id">>): Promise<SanctionReason> {
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

    static async getAll(): Promise<SanctionReason[]> {
        return prisma.sanctionReason.findMany();
    }

    static async getByType(type: SanctionType, includeSystem: boolean = false): Promise<SanctionReason[]> {
        return prisma.sanctionReason.findMany({
            where: {
                type,
                isSystem: includeSystem ? undefined : false,
            },
        });
    }

    static async getByKey(key: string): Promise<SanctionReason | null> {
        return prisma.sanctionReason.findUnique({
            where: { key },
        });
    }

    static async getById(id: number): Promise<SanctionReason | null> {
        return prisma.sanctionReason.findUnique({
            where: { id },
        });
    }

    static async getOrCreateSystemReason(key: string, defaultText: string, type: SanctionType, duration?: string): Promise<SanctionReason> {
        let reason = await prisma.sanctionReason.findUnique({
            where: { key },
        });

        if (!reason) {
            reason = await prisma.sanctionReason.create({
                data: {
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
