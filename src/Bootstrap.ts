import "reflect-metadata";

import { LeBotClient } from "@class/LeBotClient";
import { DependencyContainer } from "@di/DependencyContainer";
import { Logger } from "@utils/Logger";
import { AppModule } from "./modules/AppModule";

export class Bootstrap {
	private static logger = new Logger("Bootstrap");

	static async create(): Promise<LeBotClient> {
		const start = performance.now();
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

		// Initialize Guild.config extension
		const { GuildConfigRegister } =
			await import("@registers/GuildConfigRegister");
		GuildConfigRegister.init();

		const client = container.resolve(LeBotClient);

		const end = performance.now();
		this.logger.log(
			`LeBot initialized in ${((end - start) / 1000).toFixed(2)}s`,
		);

		return client;
	}
}
