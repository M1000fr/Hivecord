import { prismaClient } from "./prismaService";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { EConfigKey, EChannelConfigKey, ERoleConfigKey } from "../enums/EConfigKey";
import { ChannelType } from "../prisma/client/enums";

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

    static async get(key: EConfigKey): Promise<string | null> {
        const config = await prismaClient.configuration.findUnique({
            where: { key },
        });
        return config ? config.value : null;
    }

    static async set(key: EConfigKey, value: string): Promise<void> {
        await prismaClient.configuration.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });
    }

    static async delete(key: EConfigKey): Promise<void> {
        await prismaClient.configuration.delete({
            where: { key },
        });
    }

    static async getChannel(key: EChannelConfigKey): Promise<string | null> {
        const config = await prismaClient.channelConfiguration.findUnique({
            where: { key },
        });
        return config ? config.channelId : null;
    }

    static async setChannel(key: EChannelConfigKey, channelId: string, channelType: ChannelType = ChannelType.TEXT): Promise<void> {
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

    static async getRole(key: ERoleConfigKey): Promise<string | null> {
        const config = await prismaClient.roleConfiguration.findFirst({
            where: { key },
        });
        return config ? config.roleId : null;
    }

    static async setRole(key: ERoleConfigKey, roleId: string): Promise<void> {
        await prismaClient.role.upsert({
            where: { id: roleId },
            update: {},
            create: { id: roleId },
        });

        await prismaClient.$transaction([
            prismaClient.roleConfiguration.deleteMany({ where: { key } }),
            prismaClient.roleConfiguration.create({
                data: { key, roleId }
            })
        ]);
    }

    static async getRoles(key: ERoleConfigKey): Promise<string[]> {
        const configs = await prismaClient.roleConfiguration.findMany({
            where: { key },
        });
        return configs.map(c => c.roleId);
    }

    static async addRole(key: ERoleConfigKey, roleId: string): Promise<void> {
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

    static async removeRole(key: ERoleConfigKey, roleId: string): Promise<void> {
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
        const channelConfigs = await prismaClient.channelConfiguration.findMany();
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
            configuration,
            channelConfiguration,
            roleConfiguration,
            userConfiguration
        ] = await Promise.all([
            prismaClient.user.findMany(),
            prismaClient.channel.findMany(),
            prismaClient.role.findMany(),
            prismaClient.permission.findMany(),
            prismaClient.group.findMany(),
            prismaClient.userGroup.findMany(),
            prismaClient.groupPermission.findMany(),
            prismaClient.sanction.findMany(),
            prismaClient.configuration.findMany(),
            prismaClient.channelConfiguration.findMany(),
            prismaClient.roleConfiguration.findMany(),
            prismaClient.userConfiguration.findMany()
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
            configuration,
            channelConfiguration,
            roleConfiguration,
            userConfiguration
        };
    }

    static async import(configs: Record<string, string>): Promise<void> {
        // This is a simplified import, it might need to be smarter to know which key belongs to which table
        // For now, we can try to check if the key exists in the enums
        for (const [key, value] of Object.entries(configs)) {
            if (Object.values(EConfigKey).includes(key as EConfigKey)) {
                await this.set(key as EConfigKey, value);
            } else if (Object.values(EChannelConfigKey).includes(key as EChannelConfigKey)) {
                await this.setChannel(key as EChannelConfigKey, value);
            } else if (Object.values(ERoleConfigKey).includes(key as ERoleConfigKey)) {
                await this.setRole(key as ERoleConfigKey, value);
            }
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

        // 10. ChannelConfiguration
        if (backup.channelConfiguration) {
            for (const config of backup.channelConfiguration) {
                await prismaClient.channelConfiguration.upsert({
                    where: { key: config.key },
                    update: { channelId: config.channelId },
                    create: { key: config.key, channelId: config.channelId }
                });
            }
        }

        // 11. RoleConfiguration
        if (backup.roleConfiguration) {
            for (const config of backup.roleConfiguration) {
                await prismaClient.roleConfiguration.upsert({
                    where: { key: config.key },
                    update: { roleId: config.roleId },
                    create: { key: config.key, roleId: config.roleId }
                });
            }
        }

        // 12. UserConfiguration
        if (backup.userConfiguration) {
            for (const config of backup.userConfiguration) {
                await prismaClient.userConfiguration.upsert({
                    where: { key: config.key },
                    update: { userId: config.userId },
                    create: { key: config.key, userId: config.userId }
                });
            }
        }
    }
}
