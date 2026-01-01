import { LeBotClient } from "@class/LeBotClient";
import { EventController } from "@decorators/EventController";
import { On } from "@decorators/On";
import { Client } from "@decorators/params/Client";
import { Context } from "@decorators/params/Context";
import { BotEvents } from "@enums/BotEvents";
import { UserRepository } from "@src/repositories";
import type { ContextOf } from "@src/types/ContextOf.ts";

@EventController()
export default class GuildMemberRemoveSyncEvent {
	constructor(private readonly userRepository: UserRepository) {}

	@On(BotEvents.GuildMemberRemove)
	async run(
		@Client() client: LeBotClient<true>,
		@Context() [member]: ContextOf<typeof BotEvents.GuildMemberRemove>,
	) {
		await this.userRepository.upsert(member.user);
	}
}
