import { GeneralConfig } from "@modules/General/GeneralConfig";
import { SanctionType } from "@prisma/client/enums";
import { ConfigService } from "@services/ConfigService";
import { EntityService } from "@services/EntityService";
import { I18nService } from "@services/I18nService";
import { prismaClient } from "@services/prismaService";
import { LogService } from "@src/modules/Log/services/LogService";
import { Logger } from "@utils/Logger";
import { Guild, GuildMember, User } from "discord.js";
import { ModerationConfig } from "../ModerationConfig";

export class SanctionService {
	private static logger = new Logger("SanctionService");

	private static async getLanguage(guildId: string): Promise<string> {
		return (
			(await ConfigService.of(guildId, GeneralConfig)).generalLanguage ||
			"en"
		);
	}

	private static async fetchMember(
		guild: Guild,
		userId: string,
	): Promise<GuildMember | null> {
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
		const muteRoleId = await ConfigService.of(guild.id, ModerationConfig)
			.moderationMuteRoleId;
		if (!muteRoleId) {
			const lng = await this.getLanguage(guild.id);
			throw new Error(
				I18nService.t(
					"modules.moderation.services.sanction.mute_role_not_configured",
					{ lng },
				),
			);
		}

		const muteRole = guild.roles.cache.get(muteRoleId);
		if (!muteRole) {
			const lng = await this.getLanguage(guild.id);
			throw new Error(
				I18nService.t(
					"modules.moderation.services.sanction.mute_role_not_found",
					{ lng },
				),
			);
		}
		return muteRole;
	}

	private static async ensureUserExists(userId: string): Promise<void> {
		await EntityService.ensureUserById(userId);
	}

	private static async deactivateSanction(
		guildId: string,
		userId: string,
		type: SanctionType,
		expiresAt?: Date,
	): Promise<void> {
		await prismaClient.sanction.updateMany({
			where: { guildId, userId, type, active: true },
			data: { active: false, expiresAt },
		});
	}

	private static async deleteSanctionById(
		guildId: string,
		id: number,
	): Promise<void> {
		await prismaClient.sanction.deleteMany({
			where: { id, guildId },
		});
	}

	static async getActiveWarns(guildId: string, userId: string) {
		return await prismaClient.sanction.findMany({
			where: { guildId, userId, type: SanctionType.WARN, active: true },
			orderBy: { createdAt: "desc" },
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
		const member = await this.fetchMember(guild, targetUser.id);
		const lng = await this.getLanguage(guild.id);
		if (!member)
			throw new Error(
				I18nService.t(
					"modules.moderation.services.sanction.user_not_found",
					{ lng },
				),
			);
		if (!member.moderatable)
			throw new Error(
				I18nService.t(
					"modules.moderation.services.sanction.cannot_mute",
					{ lng },
				),
			);

		const muteRole = await this.getMuteRole(guild);

		if (member.roles.cache.has(muteRole.id)) {
			throw new Error(
				I18nService.t(
					"modules.moderation.services.sanction.already_muted",
					{ lng },
				),
			);
		}

		this.logger.log(
			`Muting user ${targetUser.tag} (${targetUser.id}) for ${durationString}. Reason: ${reason}. Moderator: ${moderator.tag}`,
		);

		const activeMute = await prismaClient.sanction.findFirst({
			where: {
				guildId: guild.id,
				userId: targetUser.id,
				type: SanctionType.MUTE,
				active: true,
			},
		});

		if (activeMute) {
			// Stale record (User has no role but DB says active). Deactivate it.
			await this.deactivateSanction(
				guild.id,
				targetUser.id,
				SanctionType.MUTE,
			);
		}

		await this.sendDM(
			targetUser,
			I18nService.t("modules.moderation.services.sanction.dm.mute", {
				lng,
				guild: guild.name,
				duration: durationString,
				reason,
			}),
		);

		await member.roles.add(muteRole);
		await this.logSanction(
			guild,
			targetUser,
			moderator,
			SanctionType.MUTE,
			reason,
			new Date(Date.now() + duration),
		);
		await LogService.logSanction(
			guild,
			targetUser,
			moderator,
			"Mute",
			reason,
			durationString,
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
				guildId: guild.id,
				userId: targetUser.id,
				type: SanctionType.BAN,
				active: true,
			},
		});

		const lng = await this.getLanguage(guild.id);

		if (activeBan)
			throw new Error(
				I18nService.t(
					"modules.moderation.services.sanction.already_banned",
					{ lng },
				),
			);

		const member = await this.fetchMember(guild, targetUser.id);
		if (member && !member.bannable)
			throw new Error(
				I18nService.t(
					"modules.moderation.services.sanction.cannot_ban",
					{ lng },
				),
			);

		await this.sendDM(
			targetUser,
			I18nService.t("modules.moderation.services.sanction.dm.ban", {
				lng,
				guild: guild.name,
				reason,
			}),
		);
		await guild.members.ban(targetUser, { reason, deleteMessageSeconds });
		await this.logSanction(
			guild,
			targetUser,
			moderator,
			SanctionType.BAN,
			reason,
		);
		await LogService.logSanction(
			guild,
			targetUser,
			moderator,
			"Ban",
			reason,
		);
	}

	static async warn(
		guild: Guild,
		targetUser: User,
		moderator: User,
		reason: string,
	): Promise<void> {
		const lng = await this.getLanguage(guild.id);
		await this.sendDM(
			targetUser,
			I18nService.t("modules.moderation.services.sanction.dm.warn", {
				lng,
				guild: guild.name,
				reason,
			}),
		);
		await this.logSanction(
			guild,
			targetUser,
			moderator,
			SanctionType.WARN,
			reason,
		);
		await LogService.logSanction(
			guild,
			targetUser,
			moderator,
			"Warn",
			reason,
		);
	}

	static async unwarn(
		guild: Guild,
		targetUser: User,
		moderator: User,
		warnId: number,
	): Promise<void> {
		const sanction = await prismaClient.sanction.findUnique({
			where: { id: warnId },
		});
		const lng = await this.getLanguage(guild.id);
		if (
			!sanction ||
			sanction.userId !== targetUser.id ||
			sanction.type !== SanctionType.WARN ||
			sanction.guildId !== guild.id
		) {
			throw new Error(
				I18nService.t(
					"modules.moderation.services.sanction.invalid_warn_id",
					{ lng },
				),
			);
		}

		await this.deleteSanctionById(guild.id, warnId);
		await this.sendDM(
			targetUser,
			I18nService.t("modules.moderation.services.sanction.dm.unwarn", {
				lng,
				guild: guild.name,
				warnId,
				reason: sanction.reason,
			}),
		);
		await LogService.logSanction(
			guild,
			targetUser,
			moderator,
			"Unwarn",
			`Removed warning #${warnId}`,
		);
	}

	static async unmute(guild: Guild, targetUser: User): Promise<void> {
		const member = await this.fetchMember(guild, targetUser.id);
		const lng = await this.getLanguage(guild.id);
		if (!member)
			throw new Error(
				I18nService.t(
					"modules.moderation.services.sanction.user_not_found",
					{ lng },
				),
			);

		const muteRole = await this.getMuteRole(guild);
		if (!member.roles.cache.has(muteRole.id))
			throw new Error(
				I18nService.t(
					"modules.moderation.services.sanction.not_muted",
					{ lng },
				),
			);

		await this.sendDM(
			targetUser,
			I18nService.t("modules.moderation.services.sanction.dm.unmute", {
				lng,
				guild: guild.name,
			}),
		);
		await member.roles.remove(muteRole);
		await this.deactivateSanction(
			guild.id,
			targetUser.id,
			SanctionType.MUTE,
		);
	}

	static async unban(guild: Guild, targetUser: User): Promise<void> {
		const lng = await this.getLanguage(guild.id);
		try {
			await guild.bans.fetch(targetUser.id);
		} catch {
			throw new Error(
				I18nService.t(
					"modules.moderation.services.sanction.not_banned",
					{ lng },
				),
			);
		}

		await guild.members.unban(targetUser);
		await this.deactivateSanction(
			guild.id,
			targetUser.id,
			SanctionType.BAN,
			new Date(),
		);
	}

	static async checkAndReapplyMute(member: GuildMember): Promise<void> {
		const activeMute = await prismaClient.sanction.findFirst({
			where: {
				guildId: member.guild.id,
				userId: member.id,
				type: SanctionType.MUTE,
				active: true,
			},
		});

		if (activeMute) {
			if (activeMute.expiresAt && activeMute.expiresAt < new Date()) {
				await this.deactivateSanction(
					member.guild.id,
					member.id,
					SanctionType.MUTE,
				);
				return;
			}

			try {
				const muteRole = await this.getMuteRole(member.guild);
				if (muteRole && !member.roles.cache.has(muteRole.id)) {
					await member.roles.add(muteRole);
					this.logger.log(
						`Re-applied mute role to ${member.user.tag} (${member.id}) on join.`,
					);
				}
			} catch (error) {
				this.logger.error(
					`Failed to re-apply mute role to ${member.user.tag}:`,
					error instanceof Error ? error.stack : String(error),
				);
			}
		}
	}

	private static async logSanction(
		guild: Guild,
		user: User,
		moderator: User,
		type: SanctionType,
		reason: string,
		expiresAt?: Date,
	) {
		await EntityService.ensureGuild(guild);
		await this.ensureUserExists(user.id);
		await this.ensureUserExists(moderator.id);

		await prismaClient.sanction.create({
			data: {
				guildId: guild.id,
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
