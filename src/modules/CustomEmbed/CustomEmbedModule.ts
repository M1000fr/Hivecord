import { Module } from "@decorators/Module";
import { CoreModule } from "@modules/Core/CoreModule";
import { CustomEmbedConfigHandler } from "@modules/CustomEmbed/handlers/CustomEmbedConfigHandler";
import EmbedCommand from "./commands/embed/index";
import { EmbedEditorInteractions } from "./interactions/EmbedEditorInteractions";
import { CustomEmbedService } from "./services/CustomEmbedService";

@Module({
	name: "CustomEmbed",
	imports: [CoreModule],
	commands: [EmbedCommand],
	events: [],
	providers: [
		CustomEmbedService,
		EmbedEditorInteractions,
		CustomEmbedConfigHandler,
	],
	exports: [CustomEmbedService],
})
export class CustomEmbedModule {}
