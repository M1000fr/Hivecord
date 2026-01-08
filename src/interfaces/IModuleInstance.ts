import { HivecordClient } from "@class/HivecordClient";
import { type ModuleOptions } from "./ModuleOptions";

export interface IModuleInstance {
	moduleOptions: ModuleOptions;
	setup?: (client: HivecordClient<boolean>) => Promise<void>;
}
