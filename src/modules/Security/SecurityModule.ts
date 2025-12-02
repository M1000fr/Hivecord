import { Module } from "@decorators/Module";
import { SecurityConfig } from "./SecurityConfig";
import { VoiceStateUpdateEvent } from "./events/VoiceStateUpdateEvent";
import { MessageCreateEvent } from "./events/MessageCreateEvent";
import { MessageReactionAddEvent } from "./events/MessageReactionAddEvent";
import SecurityCommand from "./commands/security/index";

@Module({
	name: "Security",
	config: SecurityConfig,
	commands: [SecurityCommand],
	events: [
		VoiceStateUpdateEvent,
		MessageCreateEvent,
		MessageReactionAddEvent,
	],
})
export class SecurityModule {}
