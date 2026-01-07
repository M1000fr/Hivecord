import { Module } from "@decorators/Module";
import { ConfigurationModule } from "@modules/Configuration/ConfigurationModule";
import { PingCommand } from "./commands/ping";
import ReadyEvent from "./events/ready/log";
import { GeneralConfig } from "./GeneralConfig";

@Module({
  name: "General",
  imports: [ConfigurationModule],
  config: GeneralConfig,
  providers: [
    // Events
    ReadyEvent,
    PingCommand,
  ],
  exports: [],
})
export class GeneralModule {}
