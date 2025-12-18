import { BaseEvent } from "@class/BaseEvent";
import type { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { StatsWriter } from "@modules/Statistics/services/StatsWriter";
import { BotEvents } from "@src/enums/BotEvents";
import type { Message } from "discord.js";

@Event({ name: BotEvents.MessageCreate })
export default class MessageCreateEvent extends BaseEvent<
	typeof BotEvents.MessageCreate
> {
	async run(client: LeBotClient<true>, message: Message): Promise<void> {
		// Ignore bot messages and DMs
		if (message.author.bot || !message.guild) return;

		try {
			const wordCount = message.content.trim().split(/\s+/).length;
			const mediaCount = message.attachments.size + message.embeds.length;

			await StatsWriter.recordMessage(
				client,
				message.author.id,
				message.channel.id,
				message.guild.id,
				wordCount,
				mediaCount,
			);
		} catch (error) {
			console.error("Failed to record message stat:", error);
		}
	}
}
