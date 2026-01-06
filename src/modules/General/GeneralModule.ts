import { Module } from "@decorators/Module";
import { GeneralConfig } from "./GeneralConfig";
import ReadyEvent from "./events/ready/log";

import { ConfigurationModule } from "@modules/Configuration/ConfigurationModule";

@Module({
	name: "General",
	imports: [ConfigurationModule],
	config: GeneralConfig,
	providers: [
		// Events
		ReadyEvent,
	],
	exports: [],
})
export class GeneralModule {}
