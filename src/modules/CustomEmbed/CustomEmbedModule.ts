import { Module } from "@decorators/Module";
import { CoreModule } from "@modules/Core/CoreModule";
import { CustomEmbedConfigHandler } from "@src/modules/CustomEmbed/configHandler/CustomEmbedConfigHandler";
import EmbedCommand from "./commands/embed/index";
import { EmbedEditorInteractions } from "./interactions/EmbedEditorInteractions";
import { CustomEmbedService } from "./services/CustomEmbedService";
import { ConfigValueService } from "@utils/ConfigValueService";
import { ConfigUIBuilderService } from "@utils/ConfigUIBuilderService";
import { ConfigValueResolverService } from "@utils/ConfigValueResolverService";
import { ConfigCacheService } from "@modules/Configuration/services/ConfigCacheService";

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
