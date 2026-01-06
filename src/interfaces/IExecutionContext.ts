import type {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Client,
	MessageContextMenuCommandInteraction,
	UserContextMenuCommandInteraction,
} from "discord.js";

export interface IExecutionContext {
	getClient(): Client;
	getInteraction():
		| ChatInputCommandInteraction
		| AutocompleteInteraction
		| UserContextMenuCommandInteraction
		| MessageContextMenuCommandInteraction;
	getClass(): object;
	getMethodName(): string;
	getHandler(): Promise<unknown>;
}
