import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { BotEvents } from "@enums/BotEvents";
import { TempVoiceService } from "@modules/Voice/services/TempVoiceService";
import { VoiceState } from "discord.js";

@Event({
	name: BotEvents.VoiceStateUpdate,
})
export default class TempVoiceEvent extends BaseEvent<
	typeof BotEvents.VoiceStateUpdate
> {
	async run(
		client: LeBotClient<true>,
		oldState: VoiceState,
		newState: VoiceState,
	) {
		await TempVoiceService.handleJoin(oldState, newState);
		await TempVoiceService.handleLeave(oldState, newState);
	}
}
