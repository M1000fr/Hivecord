import { Module } from "@decorators/Module";
import { GeneralConfig } from "./GeneralConfig";
import PingCommand from "./commands/ping/index";
import SyncCommand from "./commands/sync/index";
import ChannelSync from "./events/channelSync/sync";
import WelcomeRoleAddEvent from "./events/guildMemberAdd/roleAdd";
import GuildMemberRegisterEvent from "./events/guildMemberAdd/sync";
import WelcomeEvent from "./events/guildMemberAdd/welcome";
import GuildMemberRemoveSyncEvent from "./events/guildMemberRemove/sync";
import GuildSync from "./events/guildSync/index";
import InteractionRegistryHandler from "./events/interactionCreate/InteractionRegistryHandler";
import CommandHandlerEvent from "./events/interactionCreate/commandHandler";
import PagerHandlerEvent from "./events/interactionCreate/pagerHandler";
import ReadyEvent from "./events/ready/log";
import ResumeWelcomeSyncEvent from "./events/ready/resumeWelcomeSync";
import RoleSync from "./events/roleSync/sync";
import { PingCommandInteractions } from "./interactions/PingCommandInteractions";
import { SpacerService } from "./services/SpacerService";
import { SyncService } from "./services/SyncService";
import { WelcomeImageService } from "./services/WelcomeImageService";
import { WelcomeRoleService } from "./services/WelcomeRoleService";
import { WelcomeRoleSyncService } from "./services/WelcomeRoleSyncService";

@Module({
	name: "General",
	config: GeneralConfig,
	commands: [PingCommand, SyncCommand],
	interactions: [PingCommandInteractions],
	events: [
		ReadyEvent,
		ResumeWelcomeSyncEvent,
		CommandHandlerEvent,
		PagerHandlerEvent,
		InteractionRegistryHandler,
		WelcomeEvent,
		WelcomeRoleAddEvent,
		RoleSync,
		GuildMemberRegisterEvent,
		GuildMemberRemoveSyncEvent,
		ChannelSync,
		GuildSync,
	],
	providers: [
		SpacerService,
		SyncService,
		WelcomeImageService,
		WelcomeRoleService,
		WelcomeRoleSyncService,
	],
	exports: [
		SpacerService,
		SyncService,
		WelcomeImageService,
		WelcomeRoleService,
		WelcomeRoleSyncService,
	],
})
export class GeneralModule {}
