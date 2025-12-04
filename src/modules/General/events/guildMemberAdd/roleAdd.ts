import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { BotEvents } from "@enums/BotEvents";
import { GuildMember } from "discord.js";
import { WelcomeRoleService } from "../../services/WelcomeRoleService";

@Event({
	name: BotEvents.GuildMemberAdd,
})
export default class WelcomeRoleAddEvent extends BaseEvent<
	typeof BotEvents.GuildMemberAdd
> {
	async run(client: LeBotClient<true>, member: GuildMember) {
		await WelcomeRoleService.addWelcomeRoles(member);
	}
}
