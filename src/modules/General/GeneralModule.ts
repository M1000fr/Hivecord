import { Module } from "@decorators/Module";
import { GeneralConfig } from "./GeneralConfig";
import { CopyMessageCommand } from "./commands/CopyMessageCommand";
import { GetAvatarCommand } from "./commands/GetAvatarCommand";
import PingCommand from "./commands/ping/index";
import ChannelSync from "./events/channelSync/sync";
import WelcomeRoleAddEvent from "./events/guildMemberAdd/roleAdd";
import GuildMemberRegisterEvent from "./events/guildMemberAdd/sync";
import WelcomeEvent from "./events/guildMemberAdd/welcome";
import GuildMemberRemoveSyncEvent from "./events/guildMemberRemove/sync";
import GuildSync from "./events/guildSync/index";
import ReadyEvent from "./events/ready/log";
import ResumeWelcomeSyncEvent from "./events/ready/resumeWelcomeSync";
import RoleSync from "./events/roleSync/sync";
import { PingCommandInteractions } from "./interactions/PingCommandInteractions";
import { SpacerService } from "./services/SpacerService";
import { SyncService } from "./services/SyncService";
import { WelcomeImageService } from "./services/WelcomeImageService";
import { WelcomeRoleService } from "./services/WelcomeRoleService";
import { WelcomeRoleSyncService } from "./services/WelcomeRoleSyncService";

import { ConfigurationModule } from "@modules/Configuration/ConfigurationModule";
import { CoreModule } from "@modules/Core/CoreModule";

@Module({
	name: "General",
	imports: [CoreModule, ConfigurationModule],
	config: GeneralConfig,
	providers: [
		// Commands
		PingCommand,
		GetAvatarCommand,
		CopyMessageCommand,
		// Events
		ReadyEvent,
		ResumeWelcomeSyncEvent,
		WelcomeEvent,
		WelcomeRoleAddEvent,
		RoleSync,
		GuildMemberRegisterEvent,
		GuildMemberRemoveSyncEvent,
		ChannelSync,
		GuildSync,
		// Services
		SpacerService,
		SyncService,
		WelcomeImageService,
		WelcomeRoleService,
		WelcomeRoleSyncService,
		PingCommandInteractions,
	],
	exports: [],
})
export class GeneralModule {}
