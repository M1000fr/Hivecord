import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { BotEvents } from "@enums/BotEvents";
import { LogService } from "@modules/Log/services/LogService";
import { VoiceState } from "discord.js";

@Event({
	name: BotEvents.VoiceStateUpdate,
})
export default class VoiceStateUpdateEvent extends BaseEvent<
	typeof BotEvents.VoiceStateUpdate
> {
	async run(
		client: LeBotClient<true>,
		oldState: VoiceState,
		newState: VoiceState,
	) {
		await LogService.logVoiceState(oldState, newState);
	}
}
