import { EPermission } from "@enums/EPermission";

export interface ICommandClass {
	autocompletes?: Map<string, string>;
	defaultCommand?: string;
	defaultCommandPermission?: EPermission;
	optionRoutes?: Map<
		string,
		Map<
			string | number | boolean,
			{ method: string; permission?: EPermission }
		>
	>;
	subcommands?: Map<string, { method: string; permission?: EPermission }>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	new (...args: any[]): any;
}
