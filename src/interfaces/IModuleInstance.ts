import { LeBotClient } from "@class/LeBotClient";
import { ModuleOptions } from "./ModuleOptions";

export interface IModuleInstance {
  moduleOptions: ModuleOptions;
  setup?: (client: LeBotClient<boolean>) => Promise<void>;
}
