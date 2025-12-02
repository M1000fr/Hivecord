import { Module } from "@decorators/Module";
import { GeneralConfig } from "./GeneralConfig";
import PingCommand from "./commands/ping/index";
import ChannelCreateEvent from "./events/channelCreate/sync";
import ChannelDeleteEvent from "./events/channelDelete/sync";
import ChannelUpdateEvent from "./events/channelUpdate/sync";
import GuildMemberRegisterEvent from "./events/guildMemberAdd/sync";
import WelcomeEvent from "./events/guildMemberAdd/welcome";
import GuildMemberRemoveSyncEvent from "./events/guildMemberRemove/sync";
import InteractionRegistryHandler from "./events/interactionCreate/InteractionRegistryHandler";
import CommandHandlerEvent from "./events/interactionCreate/commandHandler";
import PagerHandlerEvent from "./events/interactionCreate/pagerHandler";
import ReadyEvent from "./events/ready/log";
import RoleCreateEvent from "./events/roleCreate/sync";
import RoleDeleteEvent from "./events/roleDelete/sync";
import RoleUpdateEvent from "./events/roleUpdate/sync";
import { PingCommandInteractions } from "./interactions/PingCommandInteractions";

@Module({
	name: "General",
	commands: [PingCommand],
	events: [
		ReadyEvent,
		CommandHandlerEvent,
		PagerHandlerEvent,
		InteractionRegistryHandler,
		WelcomeEvent,
		RoleCreateEvent,
		RoleDeleteEvent,
		RoleUpdateEvent,
		GuildMemberRegisterEvent,
		GuildMemberRemoveSyncEvent,
		ChannelCreateEvent,
		ChannelDeleteEvent,
		ChannelUpdateEvent,
	],
	interactions: [PingCommandInteractions],
	config: GeneralConfig,
})
export class GeneralModule {}
