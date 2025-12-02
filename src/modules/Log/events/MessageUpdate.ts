import { Message, type PartialMessage } from "discord.js";
import { BaseEvent } from "@class/BaseEvent";
import { Event } from "@decorators/Event";
import { LogService } from "@modules/Log/services/LogService";
import { LeBotClient } from "@class/LeBotClient";
import { BotEvents } from "@enums/BotEvents";

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
