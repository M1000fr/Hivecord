import { Module } from "@decorators/Module";
import {
	BotStateRepository,
	ChannelRepository,
	ConfigurationRepository,
	GuildRepository,
	RoleRepository,
} from "@src/repositories";
import { PrismaService } from "./services/PrismaService";
import { RedisService } from "./services/RedisService";

@Module({
	name: "Database",
	providers: [
		PrismaService,
		RedisService,
		GuildRepository,
		RoleRepository,
		ChannelRepository,
		BotStateRepository,
		ConfigurationRepository,
	],
	exports: [
		PrismaService,
		RedisService,
		GuildRepository,
		RoleRepository,
		ChannelRepository,
		BotStateRepository,
		ConfigurationRepository,
	],
})
export class DatabaseModule {}
