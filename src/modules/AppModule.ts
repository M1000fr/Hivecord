import { HivecordClient } from "@class/HivecordClient";
import { Module } from "@decorators/Module";
import { DependencyContainer } from "@di/DependencyContainer";
import { ConfigurationModule } from "@modules/Configuration/ConfigurationModule";
import { DatabaseModule } from "@modules/Database/DatabaseModule";
import { PrismaService } from "@modules/Database/services/PrismaService";
import { RedisService } from "@modules/Database/services/RedisService";
import { GeneralModule } from "@modules/General/GeneralModule";
import { CommandDeploymentService } from "@modules/Shared/services/CommandDeploymentService";
import { CommandService } from "@modules/Shared/services/CommandService";
import CommandHandlerEvent from "@modules/Shared/services/commandHandler";
import { HotReloadService } from "@modules/Shared/services/HotReloadService";
import { I18nService } from "@modules/Shared/services/I18nService";
import InteractionRegistryHandler from "@modules/Shared/services/InteractionRegistryHandler";
import { ModuleLoader } from "@modules/Shared/services/ModuleLoader";
import { PagerService } from "@modules/Shared/services/PagerService";
import PagerHandlerEvent from "@modules/Shared/services/pagerHandler";
import { ConfigFormatterService } from "@utils/ConfigFormatterService";
import { ConfigUIBuilderService } from "@utils/ConfigUIBuilderService";
import { ConfigValueResolverService } from "@utils/ConfigValueResolverService";
import { ConfigValueService } from "@utils/ConfigValueService";

@Module({
	name: "App",
	imports: [DatabaseModule, GeneralModule, ConfigurationModule],
	providers: [
		HivecordClient,
		CommandHandlerEvent,
		PagerHandlerEvent,
		InteractionRegistryHandler,
		CommandDeploymentService,
		ModuleLoader,
		HotReloadService,
		I18nService,
		CommandService,
		PagerService,
		ConfigValueService,
		ConfigFormatterService,
		ConfigUIBuilderService,
		ConfigValueResolverService,
	],
	exports: [HivecordClient],
})
export class AppModule {
	static async init(container: DependencyContainer) {
		const prismaService = container.resolve(PrismaService);
		const redisService = container.resolve(RedisService);

		// Initialize all services in parallel
		await Promise.all([
			prismaService.checkDatabaseConnection(),
			redisService.checkConnection(),
			I18nService.init(),
		]);
	}
}
