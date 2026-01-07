import { Global } from "@decorators/Global";
import { Module } from "@decorators/Module";
import { DatabaseModule } from "@modules/Database/DatabaseModule";
import ModulesCommand from "./commands/modules/index";
import { BooleanConfigHandler } from "./configHandler/BooleanConfigHandler";
import { StringConfigHandler } from "./configHandler/StringConfigHandler";
import { AttachmentConfigInteractions } from "./interactions/config/AttachmentConfigInteractions";
import { BooleanConfigInteractions } from "./interactions/config/BooleanConfigInteractions";
import { ModuleConfigInteractions } from "./interactions/config/ModuleConfigInteractions";
import { RoleChannelConfigInteractions } from "./interactions/config/RoleChannelConfigInteractions";
import { StringArrayConfigInteractions } from "./interactions/config/StringArrayConfigInteractions";
import { StringChoiceConfigInteractions } from "./interactions/config/StringChoiceConfigInteractions";
import { StringConfigInteractions } from "./interactions/config/StringConfigInteractions";
import { ChannelConfigService } from "./services/ChannelConfigService";
import { ConfigCacheService } from "./services/ConfigCacheService";
import { ConfigService } from "./services/ConfigService";
import { RoleConfigService } from "./services/RoleConfigService";

@Global()
@Module({
	name: "Configuration",
	imports: [DatabaseModule],
	providers: [
		// Services
		ConfigCacheService,
		ChannelConfigService,
		RoleConfigService,
		ConfigService,
		// Commands
		ModulesCommand,
		// Interactions
		ModuleConfigInteractions,
		BooleanConfigInteractions,
		StringConfigInteractions,
		StringChoiceConfigInteractions,
		RoleChannelConfigInteractions,
		AttachmentConfigInteractions,
		StringArrayConfigInteractions,
		// Config Handlers
		BooleanConfigHandler,
		StringConfigHandler,
	],
	exports: [ConfigService],
})
export class ConfigurationModule {}
