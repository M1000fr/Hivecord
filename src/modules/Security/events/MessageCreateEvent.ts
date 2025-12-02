import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { HeatpointService } from "@modules/Security/services/HeatpointService";
import { BotEvents } from "@src/enums/BotEvents";
import { Message } from "discord.js";

@Event({ name: typeof BotEvents.MessageCreate })
export class MessageCreateEvent extends BaseEvent<
	typeof BotEvents.MessageCreate
> {
	async run(client: LeBotClient<true>, message: Message) {
		if (message.author.bot || !message.guild) return;
		await HeatpointService.processAction(
			message.guild,
			message.channel as any,
			message.author,
			"message",
		);
	}
}
