import { Module } from "@decorators/Module";
import ModulesCommand from "./commands/modules/index";
import ConfigCommand from "./commands/config/index";
import GroupCommand from "./commands/group/index";
import EmbedCommand from "./commands/embed/index";
import ModuleConfigInteractionHandler from "./events/interactionCreate/moduleConfigHandler";
import "./interactions/EmbedEditorInteractions";

@Module({
	name: "Configuration",
	commands: [ModulesCommand, ConfigCommand, GroupCommand, EmbedCommand],
	events: [ModuleConfigInteractionHandler],
})
export class ConfigurationModule {}
