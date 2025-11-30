import { Module } from "@decorators/Module";
import StatsCommand from "./commands/stats/index";
import MessageCreateEvent from "./events/messageCreate";
import VoiceStateUpdateEvent from "./events/voiceStateUpdate";
import GuildMemberAddEvent from "./events/guildMemberAdd";
import GuildMemberRemoveEvent from "./events/guildMemberRemove";
import StatsPeriodButtonEvent from "./events/statsPeriodButton.ts";

@Module({
	name: "Statistics",
	commands: [StatsCommand],
	events: [
		MessageCreateEvent,
		VoiceStateUpdateEvent,
		GuildMemberAddEvent,
		GuildMemberRemoveEvent,
		StatsPeriodButtonEvent,
	],
})
export class StatisticsModule {}
