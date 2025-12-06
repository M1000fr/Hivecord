import type { EventOptions } from "./EventOptions";

export interface IEventClass {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	eventOptions?: EventOptions<any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	new (...args: any[]): any;
}
