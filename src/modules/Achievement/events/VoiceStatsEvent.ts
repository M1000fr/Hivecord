import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { AchievementType } from "@prisma/client/enums";
import { RedisService } from "@services/RedisService";
import { Events, VoiceState } from "discord.js";
import { AchievementService } from "../services/AchievementService";
import { StatsService } from "../services/StatsService";

@Event({ name: Events.VoiceStateUpdate })
export class VoiceStatsEvent extends BaseEvent<Events.VoiceStateUpdate> {
	private redis = RedisService.getInstance();
	private statsService = StatsService.getInstance();
	private achievementService = AchievementService.getInstance();

	async run(client: LeBotClient, oldState: VoiceState, newState: VoiceState) {
		const userId = newState.member?.id || oldState.member?.id;
		const guildId = newState.guild.id;
		if (!userId) return;
		if (newState.member?.user.bot) return;

		const key = `voice:join:${guildId}:${userId}`;

		// User joined a channel (and wasn't in one before)
		if (!oldState.channelId && newState.channelId) {
			await this.redis.set(key, Date.now());
		}
		// User left a channel (and isn't in one anymore)
		else if (oldState.channelId && !newState.channelId) {
			const joinTimeStr = await this.redis.get(key);
			if (joinTimeStr) {
				const joinTime = parseInt(joinTimeStr);
				const duration = Math.floor((Date.now() - joinTime) / 1000); // seconds

				if (duration > 0) {
					await this.statsService.incrementVoiceDuration(
						userId,
						guildId,
						duration,
					);
					await this.achievementService.checkAchievements(
						client,
						userId,
						guildId,
						AchievementType.VOICE_DURATION,
					);
				}
				await this.redis.del(key);
			}
		}
		// User switched channels - do nothing, keep timer running
	}
}
