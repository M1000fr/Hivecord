import { Module } from "@decorators/Module";
import StatsCommand from "./commands/stats/index";
import MessageCreateEvent from "./events/messageCreate";
import VoiceStateUpdateEvent from "./events/voiceStateUpdate";
import GuildMemberAddEvent from "./events/guildMemberAdd";
import GuildMemberRemoveEvent from "./events/guildMemberRemove";

@Module({
	name: "Statistics",
	commands: [StatsCommand],
	events: [
		MessageCreateEvent,
		VoiceStateUpdateEvent,
		GuildMemberAddEvent,
		GuildMemberRemoveEvent,
	],
})
export class StatisticsModule {}
