import { Module } from "@decorators/Module";
import { CommandService } from "./services/CommandService";
import { EntityService } from "./services/EntityService";
import { I18nService } from "./services/I18nService";
import { InfluxService } from "./services/InfluxService";
import { PermissionService } from "./services/PermissionService";
import { PrismaService } from "./services/PrismaService";
import { RedisService } from "./services/RedisService";

@Module({
	name: "Core",
	providers: [
		PrismaService,
		RedisService,
		InfluxService,
		I18nService,
		EntityService,
		CommandService,
		PermissionService,
	],
	exports: [
		PrismaService,
		RedisService,
		InfluxService,
		I18nService,
		EntityService,
		CommandService,
		PermissionService,
	],
})
export class CoreModule {}
