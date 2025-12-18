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
			type: "message" | "voice" | "invite";
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
		} else if (type === "voice") {
			await this.achievementService.checkAchievements(
				client,
				userId,
				guildId,
				AchievementType.VOICE_DURATION,
			);
		} else if (type === "invite") {
			await this.achievementService.checkAchievements(
				client,
				userId,
				guildId,
				AchievementType.INVITE_COUNT,
			);
		}
	}
}
