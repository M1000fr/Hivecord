import { BaseEvent } from "@class/BaseEvent";
import type { LeBotClient } from "@class/LeBotClient";
import type { Message } from "discord.js";
import { StatsService } from "@services/StatsService";
import { Event } from "@decorators/Event";

@Event({ name: "messageCreate" })
export default class MessageCreateEvent extends BaseEvent<"messageCreate"> {
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
