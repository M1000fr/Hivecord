import { type CommandOptions } from "./CommandOptions";

export interface ICommandClass {
	commandOptions?: CommandOptions;
	autocompletes?: Map<string, string>;
	defaultCommand?: string;
	optionRoutes?: Map<
		string,
		Map<string | number | boolean, { method: string }>
	>;
	subcommands?: Map<string, { method: string }>;
	new (...args: unknown[]): object;
}
