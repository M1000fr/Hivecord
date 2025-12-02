import { Module } from "@decorators/Module";
import { SecurityConfig } from "./SecurityConfig";
import SecurityCommand from "./commands/security/index";
import { MessageCreateEvent } from "./events/MessageCreateEvent";
import { MessageReactionAddEvent } from "./events/MessageReactionAddEvent";
import { VoiceStateUpdateEvent } from "./events/VoiceStateUpdateEvent";

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
