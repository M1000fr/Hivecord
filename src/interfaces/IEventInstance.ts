export interface IEventInstance {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	run(...args: any[]): Promise<void> | void;
}
