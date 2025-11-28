import { prismaClient } from "./prismaService";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

export class ConfigService {
    private static getAlgorithm() {
        return 'aes-256-cbc';
    }

    private static getKey() {
        const secret = process.env.BACKUP_SECRET || 'default-secret-key-change-me';
        return scryptSync(secret, 'salt', 32);
    }

    static encrypt(text: string): string {
        const iv = randomBytes(16);
        const cipher = createCipheriv(ConfigService.getAlgorithm(), ConfigService.getKey(), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    }

    static decrypt(text: string): string {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift()!, 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = createDecipheriv(ConfigService.getAlgorithm(), ConfigService.getKey(), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }

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

    static async getFullBackup() {
        const [
            users,
            channels,
            roles,
            permissions,
            groups,
            userGroups,
            groupPermissions,
            sanctions,
            configuration
        ] = await Promise.all([
            prismaClient.user.findMany(),
            prismaClient.channel.findMany(),
            prismaClient.role.findMany(),
            prismaClient.permission.findMany(),
            prismaClient.group.findMany(),
            prismaClient.userGroup.findMany(),
            prismaClient.groupPermission.findMany(),
            prismaClient.sanction.findMany(),
            prismaClient.configuration.findMany()
        ]);

        return {
            users,
            channels,
            roles,
            permissions,
            groups,
            userGroups,
            groupPermissions,
            sanctions,
            configuration
        };
    }

    static async import(configs: Record<string, string>): Promise<void> {
        for (const [key, value] of Object.entries(configs)) {
            await this.set(key, value);
        }
    }

    static async restoreFullBackup(backup: any): Promise<void> {
        // 1. Users
        if (backup.users) {
            for (const user of backup.users) {
                await prismaClient.user.upsert({
                    where: { id: user.id },
                    update: { leftAt: user.leftAt },
                    create: { id: user.id, leftAt: user.leftAt }
                });
            }
        }

        // 2. Channels
        if (backup.channels) {
            for (const channel of backup.channels) {
                await prismaClient.channel.upsert({
                    where: { id: channel.id },
                    update: { type: channel.type },
                    create: { id: channel.id, type: channel.type }
                });
            }
        }

        // 3. Roles
        if (backup.roles) {
            for (const role of backup.roles) {
                await prismaClient.role.upsert({
                    where: { id: role.id },
                    update: { deletedAt: role.deletedAt },
                    create: { id: role.id, deletedAt: role.deletedAt }
                });
            }
        }

        // 4. Permissions
        if (backup.permissions) {
            for (const perm of backup.permissions) {
                await prismaClient.permission.upsert({
                    where: { id: perm.id },
                    update: { name: perm.name },
                    create: { id: perm.id, name: perm.name }
                });
            }
        }

        // 5. Groups
        if (backup.groups) {
            for (const group of backup.groups) {
                await prismaClient.group.upsert({
                    where: { id: group.id },
                    update: { name: group.name, roleId: group.roleId },
                    create: { id: group.id, name: group.name, roleId: group.roleId }
                });
            }
        }

        // 6. UserGroups
        if (backup.userGroups) {
            for (const ug of backup.userGroups) {
                await prismaClient.userGroup.upsert({
                    where: { id: ug.id },
                    update: { userId: ug.userId, groupId: ug.groupId },
                    create: { id: ug.id, userId: ug.userId, groupId: ug.groupId }
                });
            }
        }

        // 7. GroupPermissions
        if (backup.groupPermissions) {
            for (const gp of backup.groupPermissions) {
                await prismaClient.groupPermission.upsert({
                    where: { id: gp.id },
                    update: { groupId: gp.groupId, permissionId: gp.permissionId },
                    create: { id: gp.id, groupId: gp.groupId, permissionId: gp.permissionId }
                });
            }
        }

        // 8. Sanctions
        if (backup.sanctions) {
            for (const sanction of backup.sanctions) {
                await prismaClient.sanction.upsert({
                    where: { id: sanction.id },
                    update: {
                        userId: sanction.userId,
                        moderatorId: sanction.moderatorId,
                        type: sanction.type,
                        reason: sanction.reason,
                        createdAt: sanction.createdAt,
                        expiresAt: sanction.expiresAt,
                        active: sanction.active
                    },
                    create: {
                        id: sanction.id,
                        userId: sanction.userId,
                        moderatorId: sanction.moderatorId,
                        type: sanction.type,
                        reason: sanction.reason,
                        createdAt: sanction.createdAt,
                        expiresAt: sanction.expiresAt,
                        active: sanction.active
                    }
                });
            }
        }

        // 9. Configuration
        if (backup.configuration) {
            for (const config of backup.configuration) {
                await prismaClient.configuration.upsert({
                    where: { key: config.key },
                    update: { value: config.value },
                    create: { key: config.key, value: config.value }
                });
            }
        }
    }
}
