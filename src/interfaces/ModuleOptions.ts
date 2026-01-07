import { Constructor, Provider, ProviderToken } from "@di/types";

export interface ModuleOptions {
  name: string;
  config?: new () => object;
  /**
   * List of providers (services, commands, events) to register in this module.
   * Use @Injectable() decorator on services, @CommandController @UserCommand @MessageCommand on commands,
   * and @EventController on events.
   */
  providers?: Provider[];
  exports?: ProviderToken[];
  imports?: Constructor<object>[];
}
