import type { LeBotClient } from "@class/LeBotClient";
import type { ModuleOptions } from "./ModuleOptions";

export interface IModuleInstance {
	moduleOptions: ModuleOptions;
	setup?: (client: LeBotClient<boolean>) => Promise<void>;
}
