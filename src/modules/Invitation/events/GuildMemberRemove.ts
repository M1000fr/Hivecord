import { BaseEvent } from "@class/BaseEvent";
import { Event } from "@decorators/Event";
import { InvitationService } from "../services/InvitationService";
import { GuildMember, type PartialGuildMember } from "discord.js";
import { LeBotClient } from "@class/LeBotClient";
import { BotEvents } from "@enums/BotEvents";

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
