import { Module } from "@decorators/Module";
import ConfigCommand from "./commands/config/index";
import ModulesCommand from "./commands/modules/index";
import { BooleanConfigInteractions } from "./interactions/config/BooleanConfigInteractions";
import { ModuleConfigInteractions } from "./interactions/config/ModuleConfigInteractions";
import { RoleChannelConfigInteractions } from "./interactions/config/RoleChannelConfigInteractions";
import { StringArrayConfigInteractions } from "./interactions/config/StringArrayConfigInteractions";
import { StringConfigInteractions } from "./interactions/config/StringConfigInteractions";
import { BackupService } from "./services/BackupService";
import { ConfigService } from "./services/ConfigService";

import { CoreModule } from "@modules/Core/CoreModule";

@Module({
	name: "Configuration",
	imports: [CoreModule],
	commands: [ModulesCommand, ConfigCommand],
	events: [],
	providers: [
		BackupService,
		ConfigService,
		ModuleConfigInteractions,
		BooleanConfigInteractions,
		StringConfigInteractions,
		RoleChannelConfigInteractions,
		StringArrayConfigInteractions,
	],
	exports: [BackupService, ConfigService],
})
export class ConfigurationModule {}
