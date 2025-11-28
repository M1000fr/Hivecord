import { Guild, User } from "discord.js";
import { prismaClient } from "./prismaService";
import { SanctionType } from "../prisma/client/enums";
import { ConfigService } from "./ConfigService";
import { ModerationConfigKeys } from "../modules/Moderation/ModerationConfig";

export class SanctionService {
	static async mute(
		guild: Guild,
		targetUser: User,
		moderator: User,
		duration: number,
		durationString: string,
		reason: string,
	): Promise<void> {
		const activeMute = await prismaClient.sanction.findFirst({
			where: {
				userId: targetUser.id,
				type: SanctionType.MUTE,
				active: true,
			},
		});

		if (activeMute) {
			throw new Error("User is already muted.");
		}

		let member = guild.members.cache.get(targetUser.id);
		if (!member) {
			try {
				member = await guild.members.fetch(targetUser.id);
			} catch (e) {
				throw new Error("User not found in this guild.");
			}
		}

		if (!member.moderatable) {
			throw new Error("I cannot mute this user.");
		}

		const muteRoleId = await ConfigService.getRole(
			ModerationConfigKeys.muteRoleId,
		);
		if (!muteRoleId) {
			throw new Error(
				"Mute role is not configured. Please ask an administrator to configure it using `/config mute-role set`.",
			);
		}

		const muteRole = guild.roles.cache.get(muteRoleId);
		if (!muteRole) {
			throw new Error("Configured mute role not found in this guild.");
		}

		try {
			await targetUser.send(
				`You have been temporarily muted in ${guild.name} for ${durationString}. Reason: ${reason}`,
			);
		} catch (e) {
			// Could not send DM
		}

		await member.roles.add(muteRole);

		await this.logSanction(
			targetUser,
			moderator,
			SanctionType.MUTE,
			reason,
			new Date(Date.now() + duration),
		);
	}

	static async ban(
		guild: Guild,
		targetUser: User,
		moderator: User,
		reason: string,
		deleteMessageSeconds: number,
	): Promise<void> {
		const activeBan = await prismaClient.sanction.findFirst({
			where: {
				userId: targetUser.id,
				type: SanctionType.BAN,
				active: true,
			},
		});

		if (activeBan) {
			throw new Error("User is already banned.");
		}

		let member = guild.members.cache.get(targetUser.id);
		if (!member) {
			try {
				member = await guild.members.fetch(targetUser.id);
			} catch (e) {
				// User likely not in guild, proceed with hackban
			}
		}

		if (member && !member.bannable) {
			throw new Error("I cannot ban this user.");
		}

		try {
			await targetUser.send(
				`You have been banned from ${guild.name}. Reason: ${reason}`,
			);
		} catch (e) {
			// Could not send DM
		}

		await guild.members.ban(targetUser, {
			reason: reason,
			deleteMessageSeconds: deleteMessageSeconds,
		});

		await this.logSanction(targetUser, moderator, SanctionType.BAN, reason);
	}

	static async unmute(
		guild: Guild,
		targetUser: User,
		reason: string,
	): Promise<void> {
		let member = guild.members.cache.get(targetUser.id);
		if (!member) {
			try {
				member = await guild.members.fetch(targetUser.id);
			} catch (e) {
				throw new Error("User not found in this guild.");
			}
		}

		const muteRoleId = await ConfigService.getRole(
			ModerationConfigKeys.muteRoleId,
		);
		if (!muteRoleId) {
			throw new Error("Mute role is not configured.");
		}

		const muteRole = guild.roles.cache.get(muteRoleId);
		if (!muteRole) {
			throw new Error("Configured mute role not found in this guild.");
		}

		if (!member.roles.cache.has(muteRoleId)) {
			throw new Error("User is not muted.");
		}

		try {
			await targetUser.send(
				`You have been unmuted in ${guild.name}. Reason: ${reason}`,
			);
		} catch (e) {
			// Could not send DM
		}

		await member.roles.remove(muteRole, reason);

		await prismaClient.sanction.updateMany({
			where: {
				userId: targetUser.id,
				type: SanctionType.MUTE,
				active: true,
			},
			data: {
				active: false,
			},
		});
	}

	static async unban(
		guild: Guild,
		targetUser: User,
		reason: string,
	): Promise<void> {
		try {
			await guild.bans.fetch(targetUser.id);
		} catch (e) {
			throw new Error("User is not banned.");
		}

		await guild.members.unban(targetUser, reason);

		await prismaClient.sanction.updateMany({
			where: {
				userId: targetUser.id,
				type: SanctionType.BAN,
				active: true,
			},
			data: {
				active: false,
			},
		});
	}

	private static async logSanction(
		user: User,
		moderator: User,
		type: SanctionType,
		reason: string,
		expiresAt?: Date,
	) {
		// Ensure user exists in DB
		await prismaClient.user.upsert({
			where: { id: user.id },
			update: {},
			create: { id: user.id },
		});

		// Ensure moderator exists in DB
		await prismaClient.user.upsert({
			where: { id: moderator.id },
			update: {},
			create: { id: moderator.id },
		});

		await prismaClient.sanction.create({
			data: {
				userId: user.id,
				moderatorId: moderator.id,
				type: type,
				reason: reason,
				expiresAt: expiresAt,
				active: true,
			},
		});
	}
}
