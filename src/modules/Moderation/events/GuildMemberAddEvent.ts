import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { Events, GuildMember } from "discord.js";
import { SanctionService } from "../services/SanctionService";

@Event({
	name: Events.GuildMemberAdd,
})
export class GuildMemberAddEvent extends BaseEvent<Events.GuildMemberAdd> {
	async run(client: LeBotClient<boolean>, member: GuildMember) {
		await SanctionService.checkAndReapplyMute(member);
	}
}
