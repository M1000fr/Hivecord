import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { BotEvents } from "@enums/BotEvents";
import { LogService } from "@modules/Log/services/LogService";
import { Message, type PartialMessage } from "discord.js";

@Event({
	name: BotEvents.MessageUpdate,
})
export default class MessageUpdateEvent extends BaseEvent<
	typeof BotEvents.MessageUpdate
> {
	async run(
		client: LeBotClient<true>,
		oldMessage: Message | PartialMessage,
		newMessage: Message | PartialMessage,
	) {
		if (!newMessage.guild) return;
		await LogService.logMessageUpdate(oldMessage, newMessage);
	}
}
