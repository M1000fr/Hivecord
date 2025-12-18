import { BaseEvent } from "@class/BaseEvent";
import type { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { StatsWriter } from "@modules/Statistics/services/StatsWriter";
import { BotEvents } from "@src/enums/BotEvents";
import type { MessageReaction, User } from "discord.js";

@Event({ name: BotEvents.MessageReactionAdd })
export default class MessageReactionAddEvent extends BaseEvent<
	typeof BotEvents.MessageReactionAdd
> {
	async run(
		client: LeBotClient<true>,
		reaction: MessageReaction,
		user: User,
	): Promise<void> {
		if (user.bot || !reaction.message.guild) return;

		try {
			await StatsWriter.incrementReactionCount(
				client,
				user.id,
				reaction.message.guild.id,
			);
			await StatsWriter.updateDailyStreak(
				client,
				user.id,
				reaction.message.guild.id,
			);
		} catch (error) {
			console.error("Failed to record reaction stat:", error);
		}
	}
}
