import type {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Client,
	UserContextMenuCommandInteraction,
	MessageContextMenuCommandInteraction,
	User,
	Message,
} from "discord.js";
import type { GuildLanguageContext } from "./GuildLanguageContext";

export type CommandArgument =
	| Client
	| ChatInputCommandInteraction
	| AutocompleteInteraction
	| UserContextMenuCommandInteraction
	| MessageContextMenuCommandInteraction
	| GuildLanguageContext
	| [ChatInputCommandInteraction | UserContextMenuCommandInteraction | MessageContextMenuCommandInteraction]
	| User
	| Message
	| undefined;
