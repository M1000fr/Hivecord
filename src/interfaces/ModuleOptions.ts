import { BaseCommand } from "@class/BaseCommand";
import { BaseEvent } from "@class/BaseEvent";
import type { Provider, ProviderToken } from "@di/types";

export interface ModuleOptions {
	name: string;
	global?: boolean;
	commands?: (new () => BaseCommand)[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	events?: (new () => BaseEvent<any>)[];
	interactions?: unknown[];
	config?: new () => object;
	providers?: Provider[];
	exports?: ProviderToken[];
}
