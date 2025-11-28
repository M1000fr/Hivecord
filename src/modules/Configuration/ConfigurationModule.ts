import { Module } from "../../decorators/Module";
import ModulesCommand from "./commands/modules/index";
import ModuleConfigInteractionHandler from "./events/interactionCreate/moduleConfigHandler";
import AutocompleteHandlerEvent from "./events/interactionCreate/autocompleteHandler";

@Module({
	name: "Configuration",
	commands: [ModulesCommand],
	events: [ModuleConfigInteractionHandler, AutocompleteHandlerEvent],
})
export class ConfigurationModule {}
