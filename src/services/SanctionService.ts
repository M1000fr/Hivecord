import { Guild, User, GuildMember } from "discord.js";
import { prismaClient } from "./prismaService";
import { SanctionType } from "../prisma/client/enums";
import { ConfigService } from "./ConfigService";
import { ModerationConfigKeys } from "../modules/Moderation/ModerationConfig";

export class SanctionService {
	private static async fetchMember(guild: Guild, userId: string): Promise<GuildMember | null> {
		const cached = guild.members.cache.get(userId);
		if (cached) return cached;
		try {
			return await guild.members.fetch(userId);
		} catch {
			return null;
		}
	}

	private static async sendDM(user: User, message: string): Promise<void> {
		try {
			await user.send(message);
		} catch {
			// Could not send DM
		}
	}

	private static async getMuteRole(guild: Guild) {
		const muteRoleId = await ConfigService.getRole(ModerationConfigKeys.muteRoleId);
		if (!muteRoleId) {
			throw new Error(
				"Mute role is not configured. Please ask an administrator to configure it using `/config mute-role set`.",
			);
		}

		const muteRole = guild.roles.cache.get(muteRoleId);
		if (!muteRole) {
			throw new Error("Configured mute role not found in this guild.");
		}
		return muteRole;
	}

	private static async ensureUserExists(userId: string): Promise<void> {
		await prismaClient.user.upsert({
			where: { id: userId },
			update: {},
			create: { id: userId },
		});
	}

	private static async deactivateSanction(userId: string, type: SanctionType): Promise<void> {
		await prismaClient.sanction.updateMany({
			where: { userId, type, active: true },
			data: { active: false },
		});
	}
	static async mute(
		guild: Guild,
		targetUser: User,
		moderator: User,
		duration: number,
		durationString: string,
		reason: string,
	): Promise<void> {
		const activeMute = await prismaClient.sanction.findFirst({
			where: { userId: targetUser.id, type: SanctionType.MUTE, active: true },
		});

		if (activeMute) throw new Error("User is already muted.");

		const member = await this.fetchMember(guild, targetUser.id);
		if (!member) throw new Error("User not found in this guild.");
		if (!member.moderatable) throw new Error("I cannot mute this user.");

		const muteRole = await this.getMuteRole(guild);

		await this.sendDM(
			targetUser,
			`You have been temporarily muted in ${guild.name} for ${durationString}. Reason: ${reason}`,
		);

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
			where: { userId: targetUser.id, type: SanctionType.BAN, active: true },
		});

		if (activeBan) throw new Error("User is already banned.");

		const member = await this.fetchMember(guild, targetUser.id);
		if (member && !member.bannable) throw new Error("I cannot ban this user.");

		await this.sendDM(targetUser, `You have been banned from ${guild.name}. Reason: ${reason}`);
		await guild.members.ban(targetUser, { reason, deleteMessageSeconds });
		await this.logSanction(targetUser, moderator, SanctionType.BAN, reason);
	}

	static async unmute(
		guild: Guild,
		targetUser: User,
		reason: string,
	): Promise<void> {
		const member = await this.fetchMember(guild, targetUser.id);
		if (!member) throw new Error("User not found in this guild.");

		const muteRole = await this.getMuteRole(guild);
		if (!member.roles.cache.has(muteRole.id)) throw new Error("User is not muted.");

		await this.sendDM(targetUser, `You have been unmuted in ${guild.name}. Reason: ${reason}`);
		await member.roles.remove(muteRole, reason);
		await this.deactivateSanction(targetUser.id, SanctionType.MUTE);
	}

	static async unban(
		guild: Guild,
		targetUser: User,
		reason: string,
	): Promise<void> {
		try {
			await guild.bans.fetch(targetUser.id);
		} catch {
			throw new Error("User is not banned.");
		}

		await guild.members.unban(targetUser, reason);
		await this.deactivateSanction(targetUser.id, SanctionType.BAN);
	}

	private static async logSanction(
		user: User,
		moderator: User,
		type: SanctionType,
		reason: string,
		expiresAt?: Date,
	) {
		await this.ensureUserExists(user.id);
		await this.ensureUserExists(moderator.id);

		await prismaClient.sanction.create({
			data: {
				userId: user.id,
				moderatorId: moderator.id,
				type,
				reason,
				expiresAt,
				active: true,
			},
		});
	}
}
