import type {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Client,
} from "discord.js";
import type { GuildLanguageContext } from "./GuildLanguageContext";

export type CommandArgument =
	| Client
	| ChatInputCommandInteraction
	| AutocompleteInteraction
	| GuildLanguageContext
	| undefined;
