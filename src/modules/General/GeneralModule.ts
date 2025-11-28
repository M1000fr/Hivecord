import { Module } from "@decorators/Module";
import { GeneralConfig } from "./GeneralConfig";
import PingCommand from "./commands/ping/index";
import LeftMemberEvent from "./events/guildMemberAdd/leftMember";
import RegisterNewMemberEvent from "./events/guildMemberAdd/register";
import WelcomeEvent from "./events/guildMemberAdd/welcome";
import InteractionRegistryHandler from "./events/interactionCreate/InteractionRegistryHandler";
import CommandHandlerEvent from "./events/interactionCreate/commandHandler";
import PagerHandlerEvent from "./events/interactionCreate/pagerHandler";
import ReadyEvent from "./events/ready/log";

@Module({
	name: "General",
	commands: [PingCommand],
	events: [
		ReadyEvent,
		CommandHandlerEvent,
		PagerHandlerEvent,
		InteractionRegistryHandler,
		WelcomeEvent,
		RegisterNewMemberEvent,
		LeftMemberEvent,
	],
	config: GeneralConfig,
})
export class GeneralModule {}
