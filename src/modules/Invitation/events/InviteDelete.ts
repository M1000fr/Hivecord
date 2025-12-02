import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { BotEvents } from "@enums/BotEvents";
import { Guild, Invite } from "discord.js";
import { InvitationService } from "../services/InvitationService";

@Event({ name: BotEvents.InviteDelete })
export class InviteDelete extends BaseEvent<typeof BotEvents.InviteDelete> {
	async run(client: LeBotClient<true>, invite: Invite) {
		if (invite.guild instanceof Guild) {
			await InvitationService.handleInviteDelete(
				invite.guild,
				invite.code,
			);
		}
	}
}
