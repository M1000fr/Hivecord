import "reflect-metadata";

import { HivecordClient } from "@class/HivecordClient";
import { DependencyContainer } from "@di/DependencyContainer";
import { Logger } from "@utils/Logger";
import { AppModule } from "./modules/AppModule";

export class Bootstrap {
  private static logger = new Logger("Bootstrap");

  static async create(): Promise<HivecordClient> {
    const start = performance.now();
    Bootstrap.logger.log("Starting Hivecord...");
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

    const client = container.resolve(HivecordClient);

    const end = performance.now();
    Bootstrap.logger.log(
      `Hivecord initialized in ${((end - start) / 1000).toFixed(2)}s`,
    );

    return client;
  }
}
