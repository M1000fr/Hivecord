import { LeBotClient } from "@class/LeBotClient";
import { EventController } from "@decorators/EventController";
import { On } from "@decorators/On";
import { Client } from "@decorators/params/Client";
import { Context } from "@decorators/params/Context";
import { BotEvents } from "@enums/BotEvents";
import { EntityService } from "@services/EntityService";
import type { ContextOf } from "@src/types/ContextOf.ts";
import { Logger } from "@utils/Logger";

@EventController()
export default class GuildMemberRegisterEvent {
	private logger = new Logger("RegisterNewMemberEvent");

	constructor(private readonly entityService: EntityService) {}

	@On(BotEvents.GuildMemberAdd)
	async run(
		@Client() client: LeBotClient<true>,
		@Context() [member]: ContextOf<typeof BotEvents.GuildMemberAdd>,
	) {
		try {
			await this.entityService.ensureUser(member.user);
		} catch (error) {
			this.logger.error(
				`Failed to register new member ${member.user.tag} (${member.id}): ${error}`,
			);
		}
	}
}
