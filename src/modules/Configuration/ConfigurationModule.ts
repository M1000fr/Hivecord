import { Module } from "@decorators/Module";
import ConfigCommand from "./commands/config/index";
import EmbedCommand from "./commands/embed/index";
import GroupCommand from "./commands/group/index";
import ModulesCommand from "./commands/modules/index";
import { EmbedEditorInteractions } from "./interactions/EmbedEditorInteractions";
import { ModuleConfigInteractions } from "./interactions/ModuleConfigInteractions";

@Module({
	name: "Configuration",
	commands: [ModulesCommand, ConfigCommand, GroupCommand, EmbedCommand],
	events: [],
	interactions: [EmbedEditorInteractions, ModuleConfigInteractions],
})
export class ConfigurationModule {}
