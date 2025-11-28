import { Module } from '@decorators/Module';
import ModulesCommand from "./commands/modules/index";
import ConfigCommand from "./commands/config/index";
import ModuleConfigInteractionHandler from "./events/interactionCreate/moduleConfigHandler";
import AutocompleteHandlerEvent from "./events/interactionCreate/autocompleteHandler";

@Module({
	name: "Configuration",
	commands: [ModulesCommand, ConfigCommand],
	events: [ModuleConfigInteractionHandler, AutocompleteHandlerEvent],
})
export class ConfigurationModule {}
