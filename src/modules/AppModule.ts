import { LeBotClient } from "@class/LeBotClient";
import { Module } from "@decorators/Module";
import { DependencyContainer } from "@di/DependencyContainer";
import { ConfigurationModule } from "@modules/Configuration/ConfigurationModule";
import { CoreModule } from "@modules/Core/CoreModule";
import { I18nService } from "@modules/Core/services/I18nService";
import { InfluxService } from "@modules/Core/services/InfluxService";
import { PrismaService } from "@modules/Core/services/PrismaService";
import { RedisService } from "@modules/Core/services/RedisService";
import { GeneralModule } from "@modules/General/GeneralModule";
import {
	ChannelRepository,
	CustomEmbedRepository,
	GuildRepository,
	RoleRepository,
	UserRepository,
} from "@src/repositories";

@Module({
	name: "App",
	global: true,
	imports: [CoreModule, GeneralModule, ConfigurationModule],
	providers: [
		LeBotClient,
		GuildRepository,
		UserRepository,
		RoleRepository,
		ChannelRepository,
		CustomEmbedRepository,
	],
	exports: [
		LeBotClient,
		GuildRepository,
		UserRepository,
		RoleRepository,
		ChannelRepository,
		CustomEmbedRepository,
	],
})
export class AppModule {
	static async init(container: DependencyContainer) {
		// Resolve and check Prisma connection
		const prismaService = container.resolve(PrismaService);
		await prismaService.checkDatabaseConnection();

		// Check other connections
		const redisService = container.resolve(RedisService);
		await redisService.checkConnection();
		await InfluxService.checkConnection();

		// Initialize I18n
		await I18nService.init();
	}
}
