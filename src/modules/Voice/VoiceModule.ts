import { Module } from '@decorators/Module';
import { VoiceConfig } from "./VoiceConfig";
import TempVoiceEvent from "./events/voiceStateUpdate/TempVoiceEvent";

@Module({
    name: "Voice",
    events: [
        TempVoiceEvent
    ],
    config: VoiceConfig
})
export class VoiceModule {}
