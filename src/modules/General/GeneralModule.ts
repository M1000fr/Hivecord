import { Module } from "@decorators/Module";
import { PingCommand } from "./commands/ping";
import ReadyEvent from "./events/ready/log";
import { GeneralConfig } from "./GeneralConfig";

@Module({
	name: "General",
	config: GeneralConfig,
	providers: [ReadyEvent, PingCommand],
})
export class GeneralModule {}
