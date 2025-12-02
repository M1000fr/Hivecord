import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { HeatpointService } from "@modules/Security/services/HeatpointService";
import { BotEvents } from "@src/enums/BotEvents";
import { MessageReaction, User } from "discord.js";

@Event({ name: typeof BotEvents.MessageReactionAdd })
export class MessageReactionAddEvent extends BaseEvent<
	typeof BotEvents.MessageReactionAdd
> {
	async run(
		client: LeBotClient<true>,
		reaction: MessageReaction,
		user: User,
	) {
		if (user.bot || !reaction.message.guild) return;
		await HeatpointService.processAction(
			reaction.message.guild,
			reaction.message.channel as any,
			user,
			"reaction",
		);
	}
}
