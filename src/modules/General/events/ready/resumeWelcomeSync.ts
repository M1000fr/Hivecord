import { LeBotClient } from "@class/LeBotClient";
import { Client } from "@decorators/Client";
import { Event } from "@decorators/Event";
import { EventController } from "@decorators/EventController";
import { Injectable } from "@decorators/Injectable";
import { BotEvents } from "@enums/BotEvents";
import { WelcomeRoleSyncService } from "../../services/WelcomeRoleSyncService";

@Injectable()
@EventController()
export default class ResumeWelcomeSyncEvent {
	constructor(
		private readonly welcomeRoleSyncService: WelcomeRoleSyncService,
	) {}

	@Event({
		name: BotEvents.ClientReady,
	})
	async run(@Client() client: LeBotClient<true>) {
		// Check if we need to resume a sync process
		await this.welcomeRoleSyncService.resume(client);
	}
}
