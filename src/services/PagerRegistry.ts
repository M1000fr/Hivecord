import { EmbedBuilder, InteractionCollector } from "discord.js";

export type PagerRenderer<T = any> = (
	items: T[],
	pageIndex: number,
	totalPages: number,
) => Promise<{ embeds: EmbedBuilder[]; components: any[]; files?: any[] }>;

export type PagerComponentHandler = (
	interaction: any,
	items: any[],
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
