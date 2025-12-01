import { Events, VoiceState } from "discord.js";
import { BaseEvent } from '@class/BaseEvent';
import { Event } from '@decorators/Event';
import { LogService } from "@modules/Log/services/LogService";
import { LeBotClient } from "@class/LeBotClient";

@Event({
    name: Events.VoiceStateUpdate,
})
export default class VoiceStateUpdateEvent extends BaseEvent<Events.VoiceStateUpdate> {
    async run(client: LeBotClient<true>, oldState: VoiceState, newState: VoiceState) {
        await LogService.logVoiceState(oldState, newState);
    }
}
