import { Module } from "@decorators/Module";
import GuildMemberAddEvent from "./events/GuildMemberAdd";
import GuildMemberRemoveEvent from "./events/GuildMemberRemove";
import GuildRoleCreateEvent from "./events/GuildRoleCreate";
import GuildRoleDeleteEvent from "./events/GuildRoleDelete";
import GuildRoleUpdateEvent from "./events/GuildRoleUpdate";
import VoiceStateUpdateEvent from "./events/VoiceStateUpdate";
import { LogConfig } from "./LogConfig";

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
	],
	config: LogConfig,
})
export class LogModule {}
