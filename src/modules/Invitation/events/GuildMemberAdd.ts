import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { BotEvents } from "@enums/BotEvents";
import { Logger } from "@utils/Logger";
import { GuildMember } from "discord.js";
import { InvitationService } from "../services/InvitationService";

@Event({ name: BotEvents.GuildMemberAdd })
export class GuildMemberAdd extends BaseEvent<typeof BotEvents.GuildMemberAdd> {
	private logger = new Logger("InvitationModule");

	async run(client: LeBotClient<true>, member: GuildMember) {
		const usedInvite = await InvitationService.findUsedInvite(member.guild);

		if (usedInvite) {
			this.logger.log(
				`User ${member.user.tag} joined using invite ${usedInvite.code} by ${usedInvite.inviter?.tag}`,
			);
			if (usedInvite.inviter) {
				await InvitationService.addInvitation(
					usedInvite.inviter.id,
					member.id,
					usedInvite.code,
				);
			}
		} else {
			this.logger.log(
				`User ${member.user.tag} joined but no invite could be determined.`,
			);
		}

		client.emit(BotEvents.MemberJoinProcessed, member, usedInvite);
	}
}
