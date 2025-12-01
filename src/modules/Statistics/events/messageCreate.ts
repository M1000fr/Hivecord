import { BaseEvent } from "@class/BaseEvent";
import type { LeBotClient } from "@class/LeBotClient";
import type { Message } from "discord.js";
import { StatsService } from "@modules/Statistics/services/StatsService";
import { Event } from "@decorators/Event";
import { BotEvents } from "@src/enums/BotEvents";

@Event({ name: BotEvents.MessageCreate })
export default class MessageCreateEvent extends BaseEvent<
	typeof BotEvents.MessageCreate
> {
	async run(client: LeBotClient<true>, message: Message): Promise<void> {
		// Ignore bot messages and DMs
		if (message.author.bot || !message.guild) return;

		try {
			await StatsService.recordMessage(
				message.author.id,
				message.channel.id,
				message.guild.id,
			);
		} catch (error) {
			console.error("Failed to record message stat:", error);
		}
	}
}
