import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { AchievementType } from "@prisma/client/enums";
import { Events, Message } from "discord.js";
import { AchievementService } from "../services/AchievementService";
import { StatsService } from "../services/StatsService";

@Event({ name: Events.MessageCreate })
export class MessageStatsEvent extends BaseEvent<Events.MessageCreate> {
	private statsService = StatsService.getInstance();
	private achievementService = AchievementService.getInstance();

	async run(client: LeBotClient, message: Message) {
		if (message.author.bot || !message.guild) return;

		const userId = message.author.id;
		const guildId = message.guild.id;

		// Increment stats
		await this.statsService.incrementMessageCount(userId, guildId);

		// Check achievements
		// We check both MESSAGE_COUNT and MESSAGE_RATE
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
	}
}
