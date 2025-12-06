import { BaseCommand } from "@class/BaseCommand";
import { BaseEvent } from "@class/BaseEvent";

export interface ModuleOptions {
	name: string;
	commands?: (new () => BaseCommand)[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	events?: (new () => BaseEvent<any>)[];
	interactions?: unknown[];
	config?: new () => object;
}
