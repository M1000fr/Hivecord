import { prismaClient } from "./prismaService";
import {
	createCipheriv,
	createDecipheriv,
	randomBytes,
	scryptSync,
} from "crypto";
import { Logger } from "../utils/Logger";

export class BackupService {
	private static logger = new Logger("BackupService");

	private static getAlgorithm() {
		return "aes-256-cbc";
	}

	private static getKey() {
		const secret =
			process.env.BACKUP_SECRET || "default-secret-key-change-me";
		return scryptSync(secret, "salt", 32);
	}

	static encrypt(text: string): string {
		const iv = randomBytes(16);
		const cipher = createCipheriv(
			BackupService.getAlgorithm(),
			BackupService.getKey(),
			iv,
		);
		let encrypted = cipher.update(text);
		encrypted = Buffer.concat([encrypted, cipher.final()]);
		return iv.toString("hex") + ":" + encrypted.toString("hex");
	}

	static decrypt(text: string): string {
		const textParts = text.split(":");
		const iv = Buffer.from(textParts.shift()!, "hex");
		const encryptedText = Buffer.from(textParts.join(":"), "hex");
		const decipher = createDecipheriv(
			BackupService.getAlgorithm(),
			BackupService.getKey(),
			iv,
		);
		let decrypted = decipher.update(encryptedText);
		decrypted = Buffer.concat([decrypted, decipher.final()]);
		return decrypted.toString();
	}

	static async createBackup(): Promise<Buffer> {
		this.logger.log("Creating full backup...");

		const users = await prismaClient.user.findMany();
		const channels = await prismaClient.channel.findMany();
		const roles = await prismaClient.role.findMany();
		const permissions = await prismaClient.permission.findMany();
		const groups = await prismaClient.group.findMany();
		const groupPermissions = await prismaClient.groupPermission.findMany();
		const userGroups = await prismaClient.userGroup.findMany();
		const sanctions = await prismaClient.sanction.findMany();
		const configurations = await prismaClient.configuration.findMany();
		const channelConfigurations = await prismaClient.channelConfiguration.findMany();
		const roleConfigurations = await prismaClient.roleConfiguration.findMany();
		const userConfigurations = await prismaClient.userConfiguration.findMany();
		const tempVoiceChannels = await prismaClient.tempVoiceChannel.findMany();
		const tempVoiceAllowedUsers = await prismaClient.tempVoiceAllowedUser.findMany();
		const tempVoiceBlockedUsers = await prismaClient.tempVoiceBlockedUser.findMany();

		const backupData = {
			timestamp: new Date().toISOString(),
			version: 2,
			data: {
				users,
				channels,
				roles,
				permissions,
				groups,
				groupPermissions,
				userGroups,
				sanctions,
				configurations,
				channelConfigurations,
				roleConfigurations,
				userConfigurations,
				tempVoiceChannels,
				tempVoiceAllowedUsers,
				tempVoiceBlockedUsers,
			},
		};

		const json = JSON.stringify(backupData);
		const encrypted = this.encrypt(json);
		return Buffer.from(encrypted, "utf-8");
	}

	static async restoreBackup(buffer: Buffer): Promise<void> {
		this.logger.log("Restoring full backup (merge/overwrite)...");

		try {
			const encrypted = buffer.toString("utf-8");
			const json = this.decrypt(encrypted);
			const backup = JSON.parse(json);
			const { data } = backup;

			await prismaClient.$transaction(async (tx) => {
				// 1. Restore Base Entities (Users, Channels, Roles, Permissions)
				if (data.users) {
					for (const user of data.users) {
						await tx.user.upsert({
							where: { id: user.id },
							update: { leftAt: user.leftAt },
							create: { id: user.id, leftAt: user.leftAt },
						});
					}
				}

				if (data.channels) {
					for (const channel of data.channels) {
						await tx.channel.upsert({
							where: { id: channel.id },
							update: { type: channel.type },
							create: { id: channel.id, type: channel.type },
						});
					}
				}

				if (data.roles) {
					for (const role of data.roles) {
						await tx.role.upsert({
							where: { id: role.id },
							update: { deletedAt: role.deletedAt },
							create: { id: role.id, deletedAt: role.deletedAt },
						});
					}
				}

				if (data.permissions) {
					for (const perm of data.permissions) {
						await tx.permission.upsert({
							where: { id: perm.id },
							update: { name: perm.name },
							create: { id: perm.id, name: perm.name },
						});
					}
				}

				// 2. Restore Configurations
				if (data.configurations) {
					for (const config of data.configurations) {
						await tx.configuration.upsert({
							where: { key: config.key },
							update: { value: config.value },
							create: { key: config.key, value: config.value },
						});
					}
				}

				if (data.channelConfigurations) {
					for (const config of data.channelConfigurations) {
						await tx.channelConfiguration.upsert({
							where: { key: config.key },
							update: { channelId: config.channelId },
							create: { key: config.key, channelId: config.channelId },
						});
					}
				}

				if (data.roleConfigurations) {
					for (const config of data.roleConfigurations) {
						await tx.roleConfiguration.upsert({
							where: { key_roleId: { key: config.key, roleId: config.roleId } },
							update: {},
							create: { key: config.key, roleId: config.roleId },
						});
					}
				}

				if (data.userConfigurations) {
					for (const config of data.userConfigurations) {
						await tx.userConfiguration.upsert({
							where: { key: config.key },
							update: { userId: config.userId },
							create: { key: config.key, userId: config.userId },
						});
					}
				}

				// 3. Restore Groups & Relations
				if (data.groups) {
					for (const group of data.groups) {
						await tx.group.upsert({
							where: { id: group.id },
							update: { name: group.name, roleId: group.roleId },
							create: { id: group.id, name: group.name, roleId: group.roleId },
						});
					}
				}

				if (data.groupPermissions) {
					for (const gp of data.groupPermissions) {
						await tx.groupPermission.upsert({
							where: { id: gp.id },
							update: { groupId: gp.groupId, permissionId: gp.permissionId },
							create: { id: gp.id, groupId: gp.groupId, permissionId: gp.permissionId },
						});
					}
				}

				if (data.userGroups) {
					for (const ug of data.userGroups) {
						await tx.userGroup.upsert({
							where: { id: ug.id },
							update: { userId: ug.userId, groupId: ug.groupId },
							create: { id: ug.id, userId: ug.userId, groupId: ug.groupId },
						});
					}
				}

				// 4. Restore Sanctions
				if (data.sanctions) {
					for (const sanction of data.sanctions) {
						await tx.sanction.upsert({
							where: { id: sanction.id },
							update: {
								userId: sanction.userId,
								moderatorId: sanction.moderatorId,
								type: sanction.type,
								reason: sanction.reason,
								createdAt: sanction.createdAt,
								expiresAt: sanction.expiresAt,
								active: sanction.active,
							},
							create: {
								id: sanction.id,
								userId: sanction.userId,
								moderatorId: sanction.moderatorId,
								type: sanction.type,
								reason: sanction.reason,
								createdAt: sanction.createdAt,
								expiresAt: sanction.expiresAt,
								active: sanction.active,
							},
						});
					}
				}

				// 5. Restore TempVoice
				if (data.tempVoiceChannels) {
					for (const tv of data.tempVoiceChannels) {
						await tx.tempVoiceChannel.upsert({
							where: { id: tv.id },
							update: {
								ownerId: tv.ownerId,
								createdAt: tv.createdAt,
								isLocked: tv.isLocked,
							},
							create: {
								id: tv.id,
								ownerId: tv.ownerId,
								createdAt: tv.createdAt,
								isLocked: tv.isLocked,
							},
						});
					}
				}

				if (data.tempVoiceAllowedUsers) {
					for (const tva of data.tempVoiceAllowedUsers) {
						await tx.tempVoiceAllowedUser.upsert({
							where: { id: tva.id },
							update: { tempVoiceId: tva.tempVoiceId, userId: tva.userId },
							create: { id: tva.id, tempVoiceId: tva.tempVoiceId, userId: tva.userId },
						});
					}
				}

				if (data.tempVoiceBlockedUsers) {
					for (const tvb of data.tempVoiceBlockedUsers) {
						await tx.tempVoiceBlockedUser.upsert({
							where: { id: tvb.id },
							update: { tempVoiceId: tvb.tempVoiceId, userId: tvb.userId },
							create: { id: tvb.id, tempVoiceId: tvb.tempVoiceId, userId: tvb.userId },
						});
					}
				}
			});

			this.logger.log("Backup restored successfully.");
		} catch (error) {
			this.logger.error(
				"Failed to restore backup",
				(error as Error)?.stack || String(error),
			);
			throw error;
		}
	}
}
