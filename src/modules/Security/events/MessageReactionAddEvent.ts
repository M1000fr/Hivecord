import { BaseEvent } from "@class/BaseEvent";
import { Event } from "@decorators/Event";
import { MessageReaction, User } from "discord.js";
import { LeBotClient } from "@class/LeBotClient";
import { HeatpointService } from "@modules/Security/services/HeatpointService";

@Event({ name: "messageReactionAdd" })
export class MessageReactionAddEvent extends BaseEvent<"messageReactionAdd"> {
    async run(client: LeBotClient<true>, reaction: MessageReaction, user: User) {
        if (user.bot || !reaction.message.guild) return;
        await HeatpointService.processAction(reaction.message.guild, reaction.message.channel as any, user, 'reaction');
    }
}
