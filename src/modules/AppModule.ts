import { LeBotClient } from "@class/LeBotClient";
import { Module } from "@decorators/Module";
import { DependencyContainer } from "@di/DependencyContainer";
import { ConfigurationModule } from "@modules/Configuration/ConfigurationModule";
import { GeneralModule } from "@modules/General/GeneralModule";
import { I18nService } from "@services/I18nService";
import { InfluxService } from "@services/InfluxService";
import { PermissionService } from "@services/PermissionService";
import { PrismaService } from "@services/PrismaService";
import { RedisService } from "@services/RedisService";
import {
	ChannelRepository,
	GuildRepository,
	RoleRepository,
	UserRepository,
} from "@src/repositories";

@Module({
	name: "App",
	global: true,
	imports: [GeneralModule, ConfigurationModule],
	providers: [
		PrismaService,
		PermissionService,
		LeBotClient,
		GuildRepository,
		UserRepository,
		RoleRepository,
		ChannelRepository,
	],
	exports: [
		PrismaService,
		PermissionService,
		LeBotClient,
		GuildRepository,
		UserRepository,
		RoleRepository,
		ChannelRepository,
	],
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
