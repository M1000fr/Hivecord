import { prismaClient } from "./prismaService";

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

    static async getAll(): Promise<Record<string, string>> {
        const configs = await prismaClient.configuration.findMany();
        const result: Record<string, string> = {};
        for (const config of configs) {
            result[config.key] = config.value;
        }
        return result;
    }

    static async import(configs: Record<string, string>): Promise<void> {
        for (const [key, value] of Object.entries(configs)) {
            await this.set(key, value);
        }
    }
}
