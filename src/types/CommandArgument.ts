import type {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Client,
} from "discord.js";
import type { TFunction } from "i18next";

export type CommandArgument =
	| Client
	| ChatInputCommandInteraction
	| AutocompleteInteraction
	| TFunction<"translation", undefined>
	| string
	| undefined;
