import { Events, Message, type PartialMessage } from "discord.js";
import { BaseEvent } from "@class/BaseEvent";
import { Event } from "@decorators/Event";
import { LogService } from "@services/LogService";
import { LeBotClient } from "@class/LeBotClient";

@Event({
	name: Events.MessageUpdate,
})
export default class MessageUpdateEvent extends BaseEvent<Events.MessageUpdate> {
	async run(
		client: LeBotClient<true>,
		oldMessage: Message | PartialMessage,
		newMessage: Message | PartialMessage,
	) {
		if (!newMessage.guild) return;
		await LogService.logMessageUpdate(oldMessage, newMessage);
	}
}
