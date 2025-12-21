import "reflect-metadata";

import { LeBotClient } from "@class/LeBotClient";
import { DependencyContainer } from "@di/DependencyContainer";
import { Logger } from "@utils/Logger";
import { AppModule } from "./modules/AppModule";

export class Bootstrap {
	private static logger = new Logger("Bootstrap");

	static async create(): Promise<LeBotClient> {
		this.logger.log("Starting LeBot...");
		const container = DependencyContainer.getInstance();

		// Register AppModule
		const appModuleOptions =
			container.getModuleOptionsFromConstructor(AppModule);
		if (appModuleOptions) {
			container.registerModule(appModuleOptions, AppModule);
		} else {
			throw new Error("AppModule is not a valid module.");
		}

		await AppModule.init(container);

		const client = container.resolve(LeBotClient);
		return client;
	}
}
