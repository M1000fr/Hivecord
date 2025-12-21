import type { CommandArgument } from "../types/CommandArgument";

export interface ICommandInstance {
	[key: string]: ((...args: CommandArgument[]) => Promise<void>) | unknown;
}
