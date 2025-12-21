import { Module } from "@decorators/Module";
import {
	ChannelRepository,
	CustomEmbedRepository,
	GuildRepository,
	RoleRepository,
	UserRepository,
} from "@src/repositories";
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
		GuildRepository,
		UserRepository,
		RoleRepository,
		ChannelRepository,
		CustomEmbedRepository,
	],
	exports: [
		PrismaService,
		RedisService,
		InfluxService,
		I18nService,
		EntityService,
		CommandService,
		PermissionService,
		GuildRepository,
		UserRepository,
		RoleRepository,
		ChannelRepository,
		CustomEmbedRepository,
	],
})
export class CoreModule {}
