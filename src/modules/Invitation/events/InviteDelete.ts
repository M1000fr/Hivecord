import { BaseEvent } from "@class/BaseEvent";
import { Event } from "@decorators/Event";
import { InvitationService } from "../services/InvitationService";
import { Invite, Guild } from "discord.js";
import { LeBotClient } from "@class/LeBotClient";
import { BotEvents } from "@enums/BotEvents";

@Event({ name: BotEvents.InviteDelete })
export class InviteDelete extends BaseEvent<typeof BotEvents.InviteDelete> {
    async run(client: LeBotClient<true>, invite: Invite) {
        if (invite.guild instanceof Guild) {
            await InvitationService.handleInviteDelete(invite.guild, invite.code);
        }
    }
}
