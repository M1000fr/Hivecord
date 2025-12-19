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

	private readonly typeMapping: Record<string, AchievementType[]> = {
		message: [
			AchievementType.MESSAGE_COUNT,
			AchievementType.MESSAGE_RATE,
			AchievementType.CHANNEL_DIVERSITY,
		],
		voice: [AchievementType.VOICE_DURATION],
		voice_join: [AchievementType.VOICE_PEAK_TIME],
		invite: [AchievementType.INVITE_COUNT],
		streak: [AchievementType.STREAK_DAYS],
		reaction: [AchievementType.REACTION_COUNT],
		command: [AchievementType.COMMAND_USAGE],
		media: [AchievementType.MEDIA_COUNT],
		words: [AchievementType.WORD_COUNT_AVG],
		stream: [AchievementType.STREAM_DURATION],
	};

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

		const guild =
			client.guilds.cache.get(guildId) ??
			(await client.guilds.fetch(guildId).catch(() => null));
		const user =
			client.users.cache.get(userId) ??
			(await client.users.fetch(userId).catch(() => null));

		if (!guild || !user) return;

		const achievementTypes = this.typeMapping[type];
		if (achievementTypes) {
			for (const achievementType of achievementTypes) {
				await this.achievementService.checkAchievements(
					user,
					guild,
					achievementType,
				);
			}
		}
	}
}
