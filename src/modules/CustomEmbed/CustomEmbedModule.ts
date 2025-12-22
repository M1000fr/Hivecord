import { Module } from "@decorators/Module";
import { CoreModule } from "@modules/Core/CoreModule";
import EmbedCommand from "./commands/embed/index";
import { EmbedEditorInteractions } from "./interactions/EmbedEditorInteractions";
import { CustomEmbedService } from "./services/CustomEmbedService";
import { CustomEmbedConfigHandler } from "@modules/CustomEmbed/handlers/CustomEmbedConfigHandler";

@Module({
	name: "CustomEmbed",
	imports: [CoreModule],
	commands: [EmbedCommand],
	events: [],
	interactions: [EmbedEditorInteractions, CustomEmbedConfigHandler],
	providers: [CustomEmbedService, CustomEmbedConfigHandler],
	exports: [CustomEmbedService],
})
export class CustomEmbedModule {}
