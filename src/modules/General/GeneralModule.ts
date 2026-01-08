import { Module } from "@decorators/Module";
import GetAvatarUserCommand, {
	GetAvatarMessageCommand,
	PingCommand,
} from "./commands/examples";
import ReadyEvent from "./events/ready/log";
import { GeneralConfig } from "./GeneralConfig";

@Module({
	name: "General",
	config: GeneralConfig,
	providers: [
		ReadyEvent,
		PingCommand,
		GetAvatarUserCommand,
		GetAvatarMessageCommand,
	],
})
export class GeneralModule {}
