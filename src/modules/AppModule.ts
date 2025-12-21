import { LeBotClient } from "@class/LeBotClient";
import { Module } from "@decorators/Module";
import { DependencyContainer } from "@di/DependencyContainer";
import { I18nService } from "@services/I18nService";
import { InfluxService } from "@services/InfluxService";
import { PrismaService } from "@services/prismaService";
import { RedisService } from "@services/RedisService";

@Module({
	name: "App",
	global: true,
	providers: [PrismaService, LeBotClient],
	exports: [PrismaService, LeBotClient],
})
export class AppModule {
	static async init(container: DependencyContainer) {
		// Resolve and check Prisma connection
		const prismaService = container.resolve(PrismaService);
		await prismaService.checkDatabaseConnection();

		// Check other connections
		await RedisService.checkConnection();
		await InfluxService.checkConnection();

		// Initialize I18n
		await I18nService.init();
	}
}
