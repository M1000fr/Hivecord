import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { BotEvents } from "@enums/BotEvents";
import { WelcomeRoleSyncService } from "../../services/WelcomeRoleSyncService";

@Event({
	name: BotEvents.ClientReady,
})
export default class ResumeWelcomeSyncEvent extends BaseEvent<
	typeof BotEvents.ClientReady
> {
	async run(client: LeBotClient<true>) {
		// Check if we need to resume a sync process
		await WelcomeRoleSyncService.resume(client);
	}
}
