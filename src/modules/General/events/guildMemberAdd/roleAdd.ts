import { LeBotClient } from "@class/LeBotClient";
import { EventController } from "@decorators/EventController";
import { Injectable } from "@decorators/Injectable";
import { On } from "@decorators/On";
import { Client } from "@decorators/params/Client";
import { Context } from "@decorators/params/Context";
import { BotEvents } from "@enums/BotEvents";
import type { ContextOf } from "@src/types/ContextOf.ts";
import { WelcomeRoleService } from "../../services/WelcomeRoleService";

@Injectable()
@EventController()
export default class WelcomeRoleAddEvent {
	constructor(private readonly welcomeRoleService: WelcomeRoleService) {}

	@On(BotEvents.GuildMemberAdd)
	async run(
		@Client() client: LeBotClient<true>,
		@Context() [member]: ContextOf<typeof BotEvents.GuildMemberAdd>,
	) {
		await this.welcomeRoleService.addWelcomeRoles(member);
	}
}
