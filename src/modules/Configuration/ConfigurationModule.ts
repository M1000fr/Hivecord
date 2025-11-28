import { Module } from "../../decorators/Module";
import { ConfigurationConfig } from "./ConfigurationConfig";
import ModulesCommand from "./commands/modules/index";
import ModuleConfigInteractionHandler from "./events/interactionCreate/moduleConfigHandler";
import AutocompleteHandlerEvent from "./events/interactionCreate/autocompleteHandler";

@Module({
	name: "Configuration",
	commands: [ModulesCommand],
	events: [ModuleConfigInteractionHandler, AutocompleteHandlerEvent],
	config: ConfigurationConfig,
})
export class ConfigurationModule {}
