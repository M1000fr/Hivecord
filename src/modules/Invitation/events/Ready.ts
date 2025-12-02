import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { BotEvents } from "@enums/BotEvents";
import { InvitationService } from "../services/InvitationService";

@Event({ name: BotEvents.ClientReady })
export class Ready extends BaseEvent<typeof BotEvents.ClientReady> {
	async run(client: LeBotClient<true>) {
		for (const guild of client.guilds.cache.values()) {
			await InvitationService.syncInvites(guild);
		}
	}
}
