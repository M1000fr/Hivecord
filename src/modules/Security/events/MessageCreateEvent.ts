import { BaseEvent } from "@class/BaseEvent";
import { Event } from "@decorators/Event";
import { Message } from "discord.js";
import { LeBotClient } from "@class/LeBotClient";
import { HeatpointService } from "@modules/Security/services/HeatpointService";
import { BotEvents } from "@src/enums/BotEvents";

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
