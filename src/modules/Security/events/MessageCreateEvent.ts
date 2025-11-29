import { BaseEvent } from "@class/BaseEvent";
import { Event } from "@decorators/Event";
import { Message } from "discord.js";
import { LeBotClient } from "@class/LeBotClient";
import { HeatpointService } from "@services/HeatpointService";

@Event({ name: "messageCreate" })
export class MessageCreateEvent extends BaseEvent<"messageCreate"> {
    async run(client: LeBotClient<true>, message: Message) {
        if (message.author.bot || !message.guild) return;
        await HeatpointService.processAction(message.guild, message.channel as any, message.author, 'message');
    }
}
