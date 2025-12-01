import { Events, Message, type PartialMessage } from "discord.js";
import { BaseEvent } from "@class/BaseEvent";
import { Event } from "@decorators/Event";
import { LogService } from "@modules/Log/services/LogService";
import { LeBotClient } from "@class/LeBotClient";

@Event({
	name: Events.MessageDelete,
})
export default class MessageDeleteEvent extends BaseEvent<Events.MessageDelete> {
	async run(client: LeBotClient<true>, message: Message | PartialMessage) {
		if (!message.guild) return;
		await LogService.logMessageDelete(message);
	}
}
