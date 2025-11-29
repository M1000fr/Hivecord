import { Module } from "@decorators/Module";
import { SecurityConfig } from "./SecurityConfig";
import { VoiceStateUpdateEvent } from "./events/VoiceStateUpdateEvent";
import { MessageCreateEvent } from "./events/MessageCreateEvent";
import { MessageReactionAddEvent } from "./events/MessageReactionAddEvent";

@Module({
    name: "Security",
    config: SecurityConfig,
    events: [
        VoiceStateUpdateEvent,
        MessageCreateEvent,
        MessageReactionAddEvent
    ]
})
export class SecurityModule {}
