import { Module } from "@decorators/Module";
import GuildMemberAddEvent from "./events/GuildMemberAdd";
import GuildMemberRemoveEvent from "./events/GuildMemberRemove";
import GuildRoleCreateEvent from "./events/GuildRoleCreate";
import GuildRoleDeleteEvent from "./events/GuildRoleDelete";
import GuildRoleUpdateEvent from "./events/GuildRoleUpdate";
import MessageDeleteEvent from "./events/MessageDelete";
import MessageUpdateEvent from "./events/MessageUpdate";
import VoiceStateUpdateEvent from "./events/VoiceStateUpdate";
import { LogConfig } from "./LogConfig";
import { LogService } from "./services/LogService";

@Module({
	name: "Log",
	commands: [],
	events: [
		GuildMemberAddEvent,
		GuildMemberRemoveEvent,
		VoiceStateUpdateEvent,
		GuildRoleCreateEvent,
		GuildRoleDeleteEvent,
		GuildRoleUpdateEvent,
		MessageUpdateEvent,
		MessageDeleteEvent,
	],
	config: LogConfig,
	providers: [LogService],
	exports: [LogService],
})
export class LogModule {}
