import { Module } from "@decorators/Module";
import ConfigCommand from "./commands/config/index";
import EmbedCommand from "./commands/embed/index";
import ModulesCommand from "./commands/modules/index";
import { BooleanConfigInteractions } from "./interactions/config/BooleanConfigInteractions";
import { ModuleConfigInteractions } from "./interactions/config/ModuleConfigInteractions";
import { RoleChannelConfigInteractions } from "./interactions/config/RoleChannelConfigInteractions";
import { StringArrayConfigInteractions } from "./interactions/config/StringArrayConfigInteractions";
import { StringConfigInteractions } from "./interactions/config/StringConfigInteractions";
import { EmbedEditorInteractions } from "./interactions/EmbedEditorInteractions";
import { BackupService } from "./services/BackupService";
import { ConfigService } from "./services/ConfigService";
import { CustomEmbedService } from "./services/CustomEmbedService";

import { CoreModule } from "@modules/Core/CoreModule";

@Module({
	name: "Configuration",
	imports: [CoreModule],
	commands: [ModulesCommand, ConfigCommand, EmbedCommand],
	events: [],
	interactions: [
		EmbedEditorInteractions,
		ModuleConfigInteractions,
		BooleanConfigInteractions,
		StringConfigInteractions,
		RoleChannelConfigInteractions,
		StringArrayConfigInteractions,
	],
	providers: [BackupService, CustomEmbedService, ConfigService],
	exports: [BackupService, CustomEmbedService, ConfigService],
})
export class ConfigurationModule {}
