import { LeBotClient } from "@class/LeBotClient";
import { Module } from "@decorators/Module";
import { DependencyContainer } from "@di/DependencyContainer";
import { ConfigurationModule } from "@modules/Configuration/ConfigurationModule";
import { CoreModule } from "@modules/Core/CoreModule";
import { I18nService } from "@modules/Core/services/I18nService";
import { PrismaService } from "@modules/Core/services/PrismaService";
import { RedisService } from "@modules/Core/services/RedisService";
import { GeneralModule } from "@modules/General/GeneralModule";

@Module({
	name: "App",
	imports: [CoreModule, GeneralModule, ConfigurationModule],
	providers: [LeBotClient],
	exports: [LeBotClient],
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
