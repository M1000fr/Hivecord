import { Module } from "@decorators/Module";
import { GeneralConfig } from "./GeneralConfig";
import ReadyEvent from "./events/ready/log";

import { ConfigurationModule } from "@modules/Configuration/ConfigurationModule";
import { CoreModule } from "@modules/Core/CoreModule";

@Module({
	name: "General",
	imports: [CoreModule, ConfigurationModule],
	config: GeneralConfig,
	providers: [
		// Events
		ReadyEvent,
	],
	exports: [],
})
export class GeneralModule {}
