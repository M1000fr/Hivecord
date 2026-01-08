import { Module } from "@decorators/Module";
import GetAvatarCommand, {
	GetAvatarMessageCommand,
	PingCommand,
} from "./commands/ping";
import ReadyEvent from "./events/ready/log";
import { GeneralConfig } from "./GeneralConfig";

@Module({
	name: "General",
	config: GeneralConfig,
	providers: [
		ReadyEvent,
		PingCommand,
		GetAvatarCommand,
		GetAvatarMessageCommand,
	],
})
export class GeneralModule {}
