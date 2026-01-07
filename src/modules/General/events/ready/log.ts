import type { LeBotClient } from "@class/LeBotClient";
import { EventController } from "@decorators/EventController";
import { On } from "@decorators/On";
import { Client } from "@decorators/params/Client";
import { BotEvents } from "@enums/BotEvents";
import { Logger } from "@utils/Logger";

@EventController()
export default class ReadyEvent {
	private logger = new Logger("ReadyEvent");

	constructor() {}

	@On({ name: BotEvents.ClientReady, once: true })
	async run(@Client() client: LeBotClient<true>) {
		if (client.user) {
			this.logger.log(`Logged in as ${client.user.tag}!`);
		}
		await client.deployCommands();
	}
}
