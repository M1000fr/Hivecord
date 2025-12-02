import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { BotEvents } from "@enums/BotEvents";
import { GuildMember, type PartialGuildMember } from "discord.js";
import { InvitationService } from "../services/InvitationService";

@Event({ name: BotEvents.GuildMemberRemove })
export class GuildMemberRemove extends BaseEvent<
	typeof BotEvents.GuildMemberRemove
> {
	async run(
		client: LeBotClient<true>,
		member: GuildMember | PartialGuildMember,
	) {
		await InvitationService.removeInvitation(member.id);
	}
}
