import { Module } from "@decorators/Module";
import { ConfigCacheService } from "@modules/Configuration/services/ConfigCacheService";
import { CoreModule } from "@modules/Core/CoreModule";
import { CustomEmbedConfigHandler } from "@src/modules/CustomEmbed/configHandler/CustomEmbedConfigHandler";
import { ConfigUIBuilderService } from "@utils/ConfigUIBuilderService";
import { ConfigValueResolverService } from "@utils/ConfigValueResolverService";
import { ConfigValueService } from "@utils/ConfigValueService";
import EmbedCommand from "./commands/embed/index";
import { EmbedEditorInteractions } from "./interactions/EmbedEditorInteractions";
import { CustomEmbedService } from "./services/CustomEmbedService";

@Module({
	name: "CustomEmbed",
	imports: [CoreModule],
	providers: [
		// Config Services (required by CustomEmbedConfigHandler)
		ConfigCacheService,
		ConfigValueService,
		ConfigUIBuilderService,
		ConfigValueResolverService,
		// Commands
		EmbedCommand,
		// Services
		CustomEmbedService,
		EmbedEditorInteractions,
		CustomEmbedConfigHandler,
	],
	exports: [CustomEmbedService],
})
export class CustomEmbedModule {}
