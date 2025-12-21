import { LeBotClient } from "@class/LeBotClient";
import { Client } from "@decorators/Client";
import { Event } from "@decorators/Event";
import { EventController } from "@decorators/EventController";
import { EventParam } from "@decorators/EventParam";
import { Injectable } from "@decorators/Injectable";
import { BotEvents } from "@enums/BotEvents";
import { GuildMember } from "discord.js";
import { WelcomeRoleService } from "../../services/WelcomeRoleService";

@Injectable()
@EventController()
export default class WelcomeRoleAddEvent {
	constructor(private readonly welcomeRoleService: WelcomeRoleService) {}

	@Event({
		name: BotEvents.GuildMemberAdd,
	})
	async run(
		@Client() client: LeBotClient<true>,
		@EventParam() member: GuildMember,
	) {
		await this.welcomeRoleService.addWelcomeRoles(member);
	}
}
