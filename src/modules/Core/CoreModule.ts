import { Module } from "@decorators/Module";
import {
	ChannelRepository,
	GuildRepository,
	RoleRepository,
} from "@src/repositories";
import { CommandService } from "./services/CommandService";
import { I18nService } from "./services/I18nService";
import { PagerService } from "./services/PagerService";
import { PrismaService } from "./services/PrismaService";
import { RedisService } from "./services/RedisService";

@Module({
	name: "Core",
	providers: [
		PrismaService,
		RedisService,
		I18nService,
		CommandService,
		PagerService,

		GuildRepository,
		RoleRepository,
		ChannelRepository,
	],
	exports: [
		PrismaService,
		RedisService,
		I18nService,
		CommandService,
		PagerService,
		GuildRepository,
		RoleRepository,
		ChannelRepository,
	],
})
export class CoreModule {}
