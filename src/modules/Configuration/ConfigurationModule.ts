import { Module } from "@decorators/Module";
import ModulesCommand from "./commands/modules/index";
import { BooleanConfigInteractions } from "./interactions/config/BooleanConfigInteractions";
import { ModuleConfigInteractions } from "./interactions/config/ModuleConfigInteractions";
import { RoleChannelConfigInteractions } from "./interactions/config/RoleChannelConfigInteractions";
import { StringArrayConfigInteractions } from "./interactions/config/StringArrayConfigInteractions";
import { StringConfigInteractions } from "./interactions/config/StringConfigInteractions";
import { ConfigService } from "./services/ConfigService";

import { CoreModule } from "@modules/Core/CoreModule";

@Module({
	name: "Configuration",
	imports: [CoreModule],
	providers: [
		// Commands
		ModulesCommand,
		// Services
		ConfigService,
		ModuleConfigInteractions,
		BooleanConfigInteractions,
		StringConfigInteractions,
		RoleChannelConfigInteractions,
		StringArrayConfigInteractions,
	],
	exports: [ConfigService],
})
export class ConfigurationModule {}
