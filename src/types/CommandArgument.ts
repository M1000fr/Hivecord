import type {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Client,
	Message,
	MessageContextMenuCommandInteraction,
	User,
	UserContextMenuCommandInteraction,
} from "discord.js";
import type { GuildLanguageContext } from "./GuildLanguageContext";

export type CommandArgument =
	| Client
	| ChatInputCommandInteraction
	| AutocompleteInteraction
	| UserContextMenuCommandInteraction
	| MessageContextMenuCommandInteraction
	| GuildLanguageContext
	| [
			| ChatInputCommandInteraction
			| UserContextMenuCommandInteraction
			| MessageContextMenuCommandInteraction,
	  ]
	| [AutocompleteInteraction]
	| User
	| Message
	| unknown // Guild config values can be any type
	| undefined;
