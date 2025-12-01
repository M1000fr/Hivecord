import { VoiceState } from "discord.js";
import { BaseEvent } from '@class/BaseEvent';
import { Event } from '@decorators/Event';
import { LogService } from "@modules/Log/services/LogService";
import { LeBotClient } from "@class/LeBotClient";
import { BotEvents } from "@enums/BotEvents";

@Event({
    name: BotEvents.VoiceStateUpdate,
})
export default class VoiceStateUpdateEvent extends BaseEvent<typeof BotEvents.VoiceStateUpdate> {
    async run(client: LeBotClient<true>, oldState: VoiceState, newState: VoiceState) {
        await LogService.logVoiceState(oldState, newState);
    }
}
