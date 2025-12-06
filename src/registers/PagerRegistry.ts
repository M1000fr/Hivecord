import {
	ActionRowBuilder,
	EmbedBuilder,
	type BaseMessageOptions,
	type Interaction,
} from "discord.js";

export type PagerRenderer<T = unknown> = (
	items: T[],
	pageIndex: number,
	totalPages: number,
) => Promise<{
	embeds: EmbedBuilder[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	components: ActionRowBuilder<any>[];
	files?: BaseMessageOptions["files"];
}>;

export type PagerComponentHandler = (
	interaction: Interaction,
	items: unknown[],
	pageIndex: number,
) => Promise<void>;

export interface PagerDefinition {
	renderPage: PagerRenderer;
	onComponent?: PagerComponentHandler;
}

export class PagerRegistry {
	private static definitions: Map<string, PagerDefinition> = new Map();

	static register(name: string, definition: PagerDefinition) {
		this.definitions.set(name, definition);
	}

	static get(name: string): PagerDefinition | undefined {
		return this.definitions.get(name);
	}
}
