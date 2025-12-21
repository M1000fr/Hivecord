import { LeBotClient } from "@class/LeBotClient";
import { Client } from "@decorators/Client";
import { Event } from "@decorators/Event";
import { EventController } from "@decorators/EventController";
import { EventParam } from "@decorators/EventParam";
import { BotEvents } from "@enums/BotEvents";
import { EntityService } from "@services/EntityService";
import { Logger } from "@utils/Logger";
import { GuildMember } from "discord.js";

@EventController()
export default class GuildMemberRegisterEvent {
	private logger = new Logger("RegisterNewMemberEvent");

	constructor(private readonly entityService: EntityService) {}

	@Event({
		name: BotEvents.GuildMemberAdd,
	})
	async run(
		@Client() client: LeBotClient<true>,
		@EventParam() member: GuildMember,
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
