export interface ContextMenuOptions {
	name: string;
	type: "user" | "message";
	defaultMemberPermissions?: string;
}

export interface IContextMenuCommandClass {
	contextMenuOptions?: ContextMenuOptions;
	execute?: string;
	new (...args: unknown[]): object;
}
