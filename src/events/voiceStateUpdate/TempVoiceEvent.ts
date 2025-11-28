import { Events, VoiceState } from "discord.js";
import { BaseEvent } from "../../class/BaseEvent";
import { Event } from "../../decorators/Event";
import { LeBotClient } from "../../class/LeBotClient";
import { TempVoiceService } from "../../services/TempVoiceService";

@Event({
	name: Events.VoiceStateUpdate,
})
export default class TempVoiceEvent extends BaseEvent<Events.VoiceStateUpdate> {
	async run(
		client: LeBotClient<true>,
		oldState: VoiceState,
		newState: VoiceState,
	) {
		await TempVoiceService.handleJoin(oldState, newState);
		await TempVoiceService.handleLeave(oldState, newState);
	}
}
