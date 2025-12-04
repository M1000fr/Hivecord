import { Module } from "@decorators/Module";
import ConfigCommand from "./commands/config/index";
import EmbedCommand from "./commands/embed/index";
import GroupCommand from "./commands/group/index";
import ModulesCommand from "./commands/modules/index";
import { BooleanConfigInteractions } from "./interactions/config/BooleanConfigInteractions";
import { ModuleConfigInteractions } from "./interactions/config/ModuleConfigInteractions";
import { RoleChannelConfigInteractions } from "./interactions/config/RoleChannelConfigInteractions";
import { StringConfigInteractions } from "./interactions/config/StringConfigInteractions";
import { EmbedEditorInteractions } from "./interactions/EmbedEditorInteractions";

@Module({
	name: "Configuration",
	commands: [ModulesCommand, ConfigCommand, GroupCommand, EmbedCommand],
	events: [],
	interactions: [
		EmbedEditorInteractions,
		ModuleConfigInteractions,
		BooleanConfigInteractions,
		StringConfigInteractions,
		RoleChannelConfigInteractions,
	],
})
export class ConfigurationModule {}
