export interface ContextMenuOptions {
	name: string;
	type: "user" | "message";
	defaultMemberPermissions?: string;
}

export interface IContextMenuCommandClass {
	contextMenuOptions?: ContextMenuOptions;
	execute?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	new (...args: any[]): any;
}
