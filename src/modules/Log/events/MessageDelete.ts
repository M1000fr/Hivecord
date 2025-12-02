import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { BotEvents } from "@enums/BotEvents";
import { LogService } from "@modules/Log/services/LogService";
import { Message, type PartialMessage } from "discord.js";

@Event({
	name: BotEvents.MessageDelete,
})
export default class MessageDeleteEvent extends BaseEvent<
	typeof BotEvents.MessageDelete
> {
	async run(client: LeBotClient<true>, message: Message | PartialMessage) {
		if (!message.guild) return;
		await LogService.logMessageDelete(message);
	}
}
