import { Module } from '@decorators/Module';
import GuildMemberAddEvent from "./events/GuildMemberAdd";
import GuildMemberRemoveEvent from "./events/GuildMemberRemove";
import VoiceStateUpdateEvent from "./events/VoiceStateUpdate";
import { LogConfig } from "./LogConfig";

@Module({
    name: "Log",
    commands: [],
    events: [GuildMemberAddEvent, GuildMemberRemoveEvent, VoiceStateUpdateEvent],
    config: LogConfig,
})
export class LogModule {}
