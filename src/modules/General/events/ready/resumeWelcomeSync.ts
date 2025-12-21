import { LeBotClient } from "@class/LeBotClient";
import { EventController } from "@decorators/EventController";
import { Injectable } from "@decorators/Injectable";
import { On } from "@decorators/On";
import { Client } from "@decorators/params/Client";
import { BotEvents } from "@enums/BotEvents";
import { WelcomeRoleSyncService } from "../../services/WelcomeRoleSyncService";

@Injectable()
@EventController()
export default class ResumeWelcomeSyncEvent {
	constructor(
		private readonly welcomeRoleSyncService: WelcomeRoleSyncService,
	) {}

	@On(BotEvents.ClientReady)
	async run(@Client() client: LeBotClient<true>) {
		// Check if we need to resume a sync process
		await this.welcomeRoleSyncService.resume(client);
	}
}
