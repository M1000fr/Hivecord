import { Module } from "@decorators/Module";
import {
	ChannelRepository,
	GuildRepository,
	RoleRepository,
	UserRepository,
} from "@src/repositories";
import { CommandDeploymentService } from "./services/CommandDeploymentService";
import { CommandService } from "./services/CommandService";
import { I18nService } from "./services/I18nService";
import { ModuleLoader } from "./services/ModuleLoader";
import { PagerService } from "./services/PagerService";
import { PermissionService } from "./services/PermissionService";
import { PrismaService } from "./services/PrismaService";
import { RedisService } from "./services/RedisService";

@Module({
	name: "Core",
	providers: [
		PrismaService,
		RedisService,
		I18nService,
		CommandService,
		PermissionService,
		PagerService,
		GuildRepository,
		UserRepository,
		RoleRepository,
		ChannelRepository,
		CommandDeploymentService,
		ModuleLoader,
	],
	exports: [
		PrismaService,
		RedisService,
		I18nService,
		CommandService,
		PermissionService,
		PagerService,
		GuildRepository,
		UserRepository,
		RoleRepository,
		ChannelRepository,
		CommandDeploymentService,
		ModuleLoader,
	],
})
export class CoreModule {}
