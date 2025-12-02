import { Module } from "@decorators/Module";
import ModulesCommand from "./commands/modules/index";
import ConfigCommand from "./commands/config/index";
import GroupCommand from "./commands/group/index";
import EmbedCommand from "./commands/embed/index";
import { EmbedEditorInteractions } from "./interactions/EmbedEditorInteractions";
import { ModuleConfigInteractions } from "./interactions/ModuleConfigInteractions";

@Module({
	name: "Configuration",
	commands: [ModulesCommand, ConfigCommand, GroupCommand, EmbedCommand],
	events: [],
	interactions: [EmbedEditorInteractions, ModuleConfigInteractions],
})
export class ConfigurationModule {}
