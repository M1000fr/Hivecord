import { BaseEvent } from "@class/BaseEvent";
import { Event } from "@decorators/Event";
import { InvitationService } from "../services/InvitationService";
import { LeBotClient } from "@class/LeBotClient";
import { BotEvents } from "@enums/BotEvents";

@Event({ name: BotEvents.ClientReady })
export class Ready extends BaseEvent<typeof BotEvents.ClientReady> {
	async run(client: LeBotClient<true>) {
		for (const guild of client.guilds.cache.values()) {
			await InvitationService.syncInvites(guild);
		}
	}
}
