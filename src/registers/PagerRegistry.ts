import {
  ActionRowBuilder,
  BaseMessageOptions,
  EmbedBuilder,
  Interaction,
  MessageActionRowComponentBuilder,
} from "discord.js";

export type PagerRenderer<T = unknown> = (
  items: T[],
  pageIndex: number,
  totalPages: number,
) => Promise<{
  embeds: EmbedBuilder[];
  components: ActionRowBuilder<MessageActionRowComponentBuilder>[];
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

export interface PagerState<T = unknown> {
  type: string;
  items: T[];
  itemsPerPage: number;
  currentPage: number;
  userId?: string;
  locale?: string;
}

export class PagerRegistry {
  private static definitions: Map<string, PagerDefinition> = new Map();

  static register(name: string, definition: PagerDefinition) {
    PagerRegistry.definitions.set(name, definition);
  }

  static get(name: string): PagerDefinition | undefined {
    return PagerRegistry.definitions.get(name);
  }
}
