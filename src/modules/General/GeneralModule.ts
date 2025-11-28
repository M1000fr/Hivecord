import { Module } from '@decorators/Module';
import { GeneralConfig } from "./GeneralConfig";
import PingCommand from "./commands/ping/index";
import ReadyEvent from "./events/ready/log";
import CommandHandlerEvent from "./events/interactionCreate/commandHandler";
import PagerHandlerEvent from "./events/interactionCreate/pagerHandler";
import InteractionRegistryHandler from "./events/interactionCreate/InteractionRegistryHandler";
import WelcomeEvent from "./events/guildMemberAdd/welcome";

@Module({
    name: "General",
    commands: [
        PingCommand
    ],
    events: [
        ReadyEvent,
        CommandHandlerEvent,
        PagerHandlerEvent,
        InteractionRegistryHandler,
        WelcomeEvent
    ],
    config: GeneralConfig
})
export class GeneralModule {}
