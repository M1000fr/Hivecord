import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { BotEvents } from "@enums/BotEvents";
import { Guild, Invite } from "discord.js";
import { InvitationService } from "../services/InvitationService";

@Event({ name: BotEvents.InviteCreate })
export class InviteCreate extends BaseEvent<typeof BotEvents.InviteCreate> {
	async run(client: LeBotClient<true>, invite: Invite) {
		if (invite.guild instanceof Guild) {
			await InvitationService.syncInvites(invite.guild);
		}
	}
}
