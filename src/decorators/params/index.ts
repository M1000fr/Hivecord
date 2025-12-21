import "reflect-metadata";

export * from "./Client";
export * from "./Context";
export * from "./GuildLanguage";
export * from "./Translate";

export const COMMAND_PARAMS_METADATA_KEY = "lebot:command:params";

export enum CommandParamType {
	Client = "CLIENT",
	Interaction = "INTERACTION",
	Translate = "TRANSLATE",
	AutocompleteInteraction = "AUTOCOMPLETE_INTERACTION",
	Context = "CONTEXT",
}

export interface CommandParameter {
	index: number;
	type: CommandParamType;
}

export function registerCommandParameter(
	target: object,
	propertyKey: string | symbol | undefined,
	index: number,
	type: CommandParamType,
) {
	if (!propertyKey) return;

	const params: CommandParameter[] =
		Reflect.getMetadata(COMMAND_PARAMS_METADATA_KEY, target, propertyKey) ||
		[];
	params.push({ index, type });
	Reflect.defineMetadata(
		COMMAND_PARAMS_METADATA_KEY,
		params,
		target,
		propertyKey,
	);
}
