import { Message, type PartialMessage } from "discord.js";
import { BaseEvent } from "@class/BaseEvent";
import { Event } from "@decorators/Event";
import { LogService } from "@modules/Log/services/LogService";
import { LeBotClient } from "@class/LeBotClient";
import { BotEvents } from "@enums/BotEvents";

@Event({
	name: BotEvents.MessageDelete,
})
export default class MessageDeleteEvent extends BaseEvent<typeof BotEvents.MessageDelete> {
	async run(client: LeBotClient<true>, message: Message | PartialMessage) {
		if (!message.guild) return;
		await LogService.logMessageDelete(message);
	}
}
