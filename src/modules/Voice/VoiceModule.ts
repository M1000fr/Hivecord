import { Module } from "@decorators/Module";
import { VoiceConfig } from "./VoiceConfig";
import TempVoiceEvent from "./events/voiceStateUpdate/TempVoiceEvent";
import { TempVoiceInteractions } from "./interactions/TempVoiceInteractions";

@Module({
	name: "Voice",
	events: [TempVoiceEvent],
	interactions: [TempVoiceInteractions],
	config: VoiceConfig,
})
export class VoiceModule {}
