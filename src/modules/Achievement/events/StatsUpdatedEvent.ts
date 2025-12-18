import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { BotEvents } from "@enums/BotEvents";
import { AchievementType } from "@prisma/client/enums";
import { AchievementService } from "../services/AchievementService";

@Event({ name: BotEvents.StatsUpdated })
export class StatsUpdatedEvent extends BaseEvent<
	typeof BotEvents.StatsUpdated
> {
	private achievementService = AchievementService.getInstance();

	async run(
		client: LeBotClient,
		data: {
			userId: string;
			guildId: string;
			type:
				| "message"
				| "voice"
				| "invite"
				| "streak"
				| "reaction"
				| "command"
				| "media"
				| "words"
				| "stream"
				| "voice_join";
		},
	) {
		const { userId, guildId, type } = data;

		if (type === "message") {
			await this.achievementService.checkAchievements(
				client,
				userId,
				guildId,
				AchievementType.MESSAGE_COUNT,
			);
			await this.achievementService.checkAchievements(
				client,
				userId,
				guildId,
				AchievementType.MESSAGE_RATE,
			);
			await this.achievementService.checkAchievements(
				client,
				userId,
				guildId,
				AchievementType.CHANNEL_DIVERSITY,
			);
		} else if (type === "voice") {
			await this.achievementService.checkAchievements(
				client,
				userId,
				guildId,
				AchievementType.VOICE_DURATION,
			);
		} else if (type === "voice_join") {
			await this.achievementService.checkAchievements(
				client,
				userId,
				guildId,
				AchievementType.VOICE_PEAK_TIME,
			);
		} else if (type === "invite") {
			await this.achievementService.checkAchievements(
				client,
				userId,
				guildId,
				AchievementType.INVITE_COUNT,
			);
		} else if (type === "streak") {
			await this.achievementService.checkAchievements(
				client,
				userId,
				guildId,
				AchievementType.STREAK_DAYS,
			);
		} else if (type === "reaction") {
			await this.achievementService.checkAchievements(
				client,
				userId,
				guildId,
				AchievementType.REACTION_COUNT,
			);
		} else if (type === "command") {
			await this.achievementService.checkAchievements(
				client,
				userId,
				guildId,
				AchievementType.COMMAND_USAGE,
			);
		} else if (type === "media") {
			await this.achievementService.checkAchievements(
				client,
				userId,
				guildId,
				AchievementType.MEDIA_COUNT,
			);
		} else if (type === "words") {
			await this.achievementService.checkAchievements(
				client,
				userId,
				guildId,
				AchievementType.WORD_COUNT_AVG,
			);
		} else if (type === "stream") {
			await this.achievementService.checkAchievements(
				client,
				userId,
				guildId,
				AchievementType.STREAM_DURATION,
			);
		}
	}
}
