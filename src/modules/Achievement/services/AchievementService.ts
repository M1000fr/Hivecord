import { LeBotClient } from "@class/LeBotClient";
import { MessageTemplate } from "@class/MessageTemplate";
import { AchievementConfigKeys } from "@modules/Achievement/AchievementConfig";
import { StatsReader } from "@modules/Statistics/services/StatsReader";
import { AchievementCategory, AchievementType } from "@prisma/client/enums";
import { ConfigService } from "@services/ConfigService";
import { prismaClient } from "@services/prismaService";
import { Logger } from "@utils/Logger";
import { ChannelType, TextChannel } from "discord.js";

export class AchievementService {
	private static instance: AchievementService;
	private logger = new Logger("AchievementService");

	public static getInstance(): AchievementService {
		if (!AchievementService.instance) {
			AchievementService.instance = new AchievementService();
		}
		return AchievementService.instance;
	}

	async checkAchievements(
		client: LeBotClient,
		userId: string,
		guildId: string,
		type: AchievementType,
	) {
		// Fetch all active achievements for this guild and type
		const achievements = await prismaClient.achievement.findMany({
			where: {
				guildId,
				type,
				isActive: true,
			},
		});

		if (achievements.length === 0) return;

		// Get user stats
		const stats = await StatsReader.getUserStats(userId, guildId);
		// Note: stats might be null if user has no stats yet, but we might still need to check MESSAGE_RATE

		// Get already unlocked achievements
		const unlocked = await prismaClient.userAchievement.findMany({
			where: { userId, guildId },
			select: { achievementId: true },
		});
		const unlockedIds = new Set(unlocked.map((u) => u.achievementId));

		for (const achievement of achievements) {
			if (unlockedIds.has(achievement.id)) continue;

			let qualified = false;

			if (type === AchievementType.MESSAGE_COUNT && stats) {
				if (stats.messageCount >= achievement.threshold)
					qualified = true;
			} else if (type === AchievementType.VOICE_DURATION && stats) {
				if (stats.voiceDuration >= achievement.threshold)
					qualified = true;
			} else if (type === AchievementType.INVITE_COUNT && stats) {
				if (stats.inviteCount >= achievement.threshold)
					qualified = true;
			} else if (type === AchievementType.MESSAGE_RATE) {
				const rate = await StatsReader.getMessageCountInLastHour(
					userId,
					guildId,
				);
				if (rate >= achievement.threshold) qualified = true;
			} else if (type === AchievementType.STREAK_DAYS && stats) {
				if ((stats.dailyStreak || 0) >= achievement.threshold)
					qualified = true;
			} else if (type === AchievementType.CHANNEL_DIVERSITY && stats) {
				// We need to check channel diversity. StatsReader has channelBreakdown in getUserMessageStats
				const msgStats = await StatsReader.getUserMessageStats(
					userId,
					guildId,
					{ start: new Date(0), end: new Date() },
				);
				if (msgStats.channelBreakdown.length >= achievement.threshold)
					qualified = true;
			} else if (type === AchievementType.REACTION_COUNT && stats) {
				if ((stats.reactionCount || 0) >= achievement.threshold)
					qualified = true;
			} else if (type === AchievementType.STREAM_DURATION && stats) {
				if ((stats.streamDuration || 0) >= achievement.threshold)
					qualified = true;
			} else if (type === AchievementType.WORD_COUNT_AVG && stats) {
				const totalWords = stats.totalWords || 0;
				const msgCount = stats.messageCount || 1;
				const avg = totalWords / msgCount;
				if (avg >= achievement.threshold) qualified = true;
			} else if (type === AchievementType.MEDIA_COUNT && stats) {
				if ((stats.mediaCount || 0) >= achievement.threshold)
					qualified = true;
			} else if (type === AchievementType.COMMAND_USAGE && stats) {
				if ((stats.commandCount || 0) >= achievement.threshold)
					qualified = true;
			} else if (type === AchievementType.VOICE_PEAK_TIME) {
				// This is checked when the event is triggered, usually during voice tick
				// We assume the event trigger means the condition is met or we check current time
				const now = new Date();
				const hour = now.getHours();
				// Threshold is likely a specific hour or range encoded?
				// Or maybe we just check if current time matches "Night Owl" (2AM-5AM)
				// For simplicity, let's say threshold 1 means "Night Owl" logic
				if (achievement.threshold === 1) {
					if (hour >= 2 && hour < 5) qualified = true;
				}
			}

			if (qualified) {
				await this.unlockAchievement(
					client,
					userId,
					guildId,
					achievement.id,
				);
			}
		}
	}

	async unlockAchievement(
		client: LeBotClient,
		userId: string,
		guildId: string,
		achievementId: string,
	) {
		try {
			const achievement = await prismaClient.achievement.findUnique({
				where: { guildId_id: { guildId, id: achievementId } },
			});

			if (!achievement) return;

			// Create UserAchievement
			await prismaClient.userAchievement.create({
				data: {
					userId,
					guildId,
					achievementId,
				},
			});

			this.logger.log(
				`User ${userId} unlocked achievement ${achievement.name} in guild ${guildId}`,
			);

			// Announce
			const channelId = await ConfigService.getChannel(
				guildId,
				AchievementConfigKeys.announcementChannelId,
			);
			if (channelId) {
				const channel = await client.channels.fetch(channelId);
				if (
					channel &&
					(channel.type === ChannelType.GuildText ||
						channel.type === ChannelType.GuildAnnouncement)
				) {
					const user = await client.users.fetch(userId);
					const announcementMessage = await ConfigService.get(
						guildId,
						AchievementConfigKeys.announcementMessage,
					);
					const message = new MessageTemplate(
						announcementMessage ||
							"🏆 **Achievement Unlocked!**\n{user} has unlocked **{achievement.name}**!\n*{achievement.description}*",
					)
						.addContext("user", user)
						.addContext("achievement", achievement)
						.resolve();

					await (channel as TextChannel).send(message);
				}
			}

			// Check for completion rewards
			await this.checkCompletionRewards(client, userId, guildId);
		} catch (error) {
			this.logger.error(
				`Error unlocking achievement ${achievementId} for user ${userId}:`,
				error instanceof Error ? error.stack : String(error),
			);
		}
	}

	async checkCompletionRewards(
		client: LeBotClient,
		userId: string,
		guildId: string,
	) {
		const categories = [
			AchievementCategory.GLOBAL,
			AchievementCategory.ROTATED,
		];

		for (const category of categories) {
			const achievements = await prismaClient.achievement.findMany({
				where: { guildId, category, isActive: true },
			});

			if (achievements.length === 0) continue;

			const userAchievements =
				await prismaClient.userAchievement.findMany({
					where: { userId, guildId },
				});
			const userUnlockedIds = new Set(
				userAchievements.map((u) => u.achievementId),
			);

			const allUnlocked = achievements.every((a) =>
				userUnlockedIds.has(a.id),
			);

			if (allUnlocked) {
				const configKey =
					category === AchievementCategory.GLOBAL
						? AchievementConfigKeys.globalCompletionRoleId
						: AchievementConfigKeys.rotatedCompletionRoleId;
				const roleId = await ConfigService.get(guildId, configKey);

				if (roleId) {
					try {
						const guild = await client.guilds.fetch(guildId);
						const member = await guild.members.fetch(userId);
						if (member && !member.roles.cache.has(roleId)) {
							await member.roles.add(roleId);
							this.logger.log(
								`Awarded completion role ${roleId} to ${userId} for category ${category}`,
							);
						}
					} catch (error) {
						this.logger.error(
							`Failed to award completion role for ${category}:`,
							error instanceof Error
								? error.stack
								: String(error),
						);
					}
				}
			}
		}
	}

	async checkAndRotate(guildId: string) {
		const intervalStr = await ConfigService.get(
			guildId,
			AchievementConfigKeys.rotationIntervalDays,
		);
		const intervalDays = intervalStr ? parseInt(intervalStr) : 7;

		const activeRotated = await prismaClient.achievement.findFirst({
			where: {
				guildId,
				category: AchievementCategory.ROTATED,
				isActive: true,
			},
		});

		let shouldRotate = false;
		if (!activeRotated) {
			const count = await prismaClient.achievement.count({
				where: { guildId, category: AchievementCategory.ROTATED },
			});
			if (count > 0) shouldRotate = true;
		} else {
			const diff = Date.now() - activeRotated.updatedAt.getTime();
			const days = diff / (1000 * 60 * 60 * 24);
			if (days >= intervalDays) shouldRotate = true;
		}

		if (shouldRotate) {
			await this.rotateAchievements(guildId);
		}
	}

	async rotateAchievements(guildId: string) {
		// 1. Deactivate all rotated
		await prismaClient.achievement.updateMany({
			where: { guildId, category: AchievementCategory.ROTATED },
			data: { isActive: false },
		});

		// 2. Pick random ones (e.g. 3)
		const allRotated = await prismaClient.achievement.findMany({
			where: { guildId, category: AchievementCategory.ROTATED },
		});

		if (allRotated.length === 0) return;

		// Shuffle
		const shuffled = allRotated.sort(() => 0.5 - Math.random());
		const selected = shuffled.slice(0, 3); // Pick 3

		// 3. Activate them
		const ids = selected.map((a) => a.id);
		await prismaClient.achievement.updateMany({
			where: { guildId, id: { in: ids } },
			data: { isActive: true }, // This updates updatedAt too
		});

		this.logger.log(
			`Rotated achievements for guild ${guildId}: ${ids.join(", ")}`,
		);
	}
}
