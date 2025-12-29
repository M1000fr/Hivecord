import type { TFunction } from "@modules/Core/services/I18nService";
import { I18nService } from "@modules/Core/services/I18nService";
import type { RedisService } from "@modules/Core/services/RedisService";
import { PagerRegistry } from "@registers/PagerRegistry";
import type { GuildLanguageContext } from "@src/types/GuildLanguageContext";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	InteractionCollector,
	type BaseMessageOptions,
	type ChannelSelectMenuBuilder,
	type CollectedInteraction,
	type Interaction,
	type MentionableSelectMenuBuilder,
	type RepliableInteraction,
	type RoleSelectMenuBuilder,
	type StringSelectMenuBuilder,
	type UserSelectMenuBuilder,
} from "discord.js";

type PagerComponentBuilder =
	| ButtonBuilder
	| StringSelectMenuBuilder
	| UserSelectMenuBuilder
	| RoleSelectMenuBuilder
	| MentionableSelectMenuBuilder
	| ChannelSelectMenuBuilder;

export interface PagerOptions<T> {
	items: T[];
	itemsPerPage: number;
	renderPage?: (
		items: T[],
		pageIndex: number,
		totalPages: number,
	) => Promise<{
		embeds: EmbedBuilder[];
		components?: ActionRowBuilder<PagerComponentBuilder>[];
		files?: BaseMessageOptions["files"];
	}>;
	filter?: (interaction: Interaction) => boolean;
	time?: number;
	onComponent?: (
		interaction: CollectedInteraction,
		collector: InteractionCollector<CollectedInteraction>,
	) => Promise<void>;
	type?: string; // Unique identifier for the pager type (required for persistence)
	userId?: string; // User ID allowed to interact (for persistence)
	languageContext: GuildLanguageContext;
}

export class Pager<T> {
	private items: T[];
	private itemsPerPage: number;
	private currentPage: number = 0;
	private renderPage: (
		items: T[],
		pageIndex: number,
		totalPages: number,
	) => Promise<{
		embeds: EmbedBuilder[];
		components?: ActionRowBuilder<PagerComponentBuilder>[];
		files?: BaseMessageOptions["files"];
	}>;
	private filter: (interaction: Interaction) => boolean;
	private time: number;
	private onComponent?: (
		interaction: CollectedInteraction,
		collector: InteractionCollector<CollectedInteraction>,
	) => Promise<void>;
	private type?: string;
	private userId?: string;
	private t: TFunction;
	private locale: string; // Stored for Redis serialization
	private redisService: RedisService;

	constructor(options: PagerOptions<T>, redisService: RedisService) {
		this.items = options.items;
		this.itemsPerPage = options.itemsPerPage;
		this.renderPage = options.renderPage!;
		this.filter = options.filter || (() => true);
		this.time = options.time || 300000; // 5 minutes default
		this.onComponent = options.onComponent;
		this.type = options.type;
		this.userId = options.userId;
		this.redisService = redisService;

		this.locale = options.languageContext.locale || "en";
		this.t =
			options.languageContext.t || I18nService.getFixedT(this.locale);

		if (this.type && !this.renderPage) {
			const definition = PagerRegistry.get(this.type);
			if (definition) {
				this.renderPage = definition.renderPage;
				// onComponent is handled differently for persistent pagers
			}
		}
	}

	public async start(interaction: RepliableInteraction) {
		const totalPages = Math.ceil(this.items.length / this.itemsPerPage);

		const getPageContent = async () => {
			const start = this.currentPage * this.itemsPerPage;
			const end = start + this.itemsPerPage;
			const pageItems = this.items.slice(start, end);

			const { embeds, components, files } = await this.renderPage(
				pageItems,
				this.currentPage,
				totalPages,
			);

			const finalComponents = components ? [...components] : [];

			if (totalPages > 1) {
				const navigationRow = new ActionRowBuilder<ButtonBuilder>();
				navigationRow.addComponents(
					new ButtonBuilder()
						.setCustomId("pager_prev")
						.setLabel(this.t("common.previous"))
						.setStyle(ButtonStyle.Secondary)
						.setDisabled(this.currentPage === 0),
					new ButtonBuilder()
						.setCustomId("pager_next")
						.setLabel(this.t("common.next"))
						.setStyle(ButtonStyle.Secondary)
						.setDisabled(this.currentPage === totalPages - 1),
				);
				finalComponents.push(navigationRow);
			}

			return { embeds, components: finalComponents, files: files || [] };
		};

		const initialContent = await getPageContent();

		let message;
		if (interaction.deferred || interaction.replied) {
			message = await interaction.editReply(initialContent);
		} else {
			await interaction.reply(initialContent);
			message = await interaction.fetchReply();
		}

		// If persistent, save state and return (don't start collector)
		if (this.type) {
			const redis = this.redisService.client;
			const state = {
				items: this.items,
				itemsPerPage: this.itemsPerPage,
				currentPage: this.currentPage,
				type: this.type,
				userId: this.userId,
				totalPages: totalPages,
				locale: this.locale,
			};
			await redis.set(`pager:${message.id}`, JSON.stringify(state));
			// Set expiry if needed, e.g. 1 hour
			await redis.expire(`pager:${message.id}`, 3600);
			return;
		}

		const collector = message.createMessageComponentCollector({
			filter: this.filter,
			time: this.time,
		});

		collector.on("collect", async (i) => {
			if (this.userId && i.user.id !== this.userId) {
				await i.reply({
					content: this.t("utils.pager.not_allowed"),
					ephemeral: true,
				});
				return;
			}

			if (i.customId === "pager_prev") {
				this.currentPage--;
				const content = await getPageContent();
				await i.update(content);
			} else if (i.customId === "pager_next") {
				this.currentPage++;
				const content = await getPageContent();
				await i.update(content);
			} else {
				if (this.onComponent) {
					await this.onComponent(
						i as unknown as CollectedInteraction,
						collector as unknown as InteractionCollector<CollectedInteraction>,
					);
				}
			}
		});

		collector.on("end", () => {
			// Optional: Disable components on end
		});

		return collector;
	}

	/**
	 * Create navigation buttons for pager
	 * @param currentPage Current page index
	 * @param totalPages Total number of pages
	 * @param t Translation function
	 * @returns ActionRow with navigation buttons or null if only one page
	 */
	static createNavigationRow(
		currentPage: number,
		totalPages: number,
		t: TFunction,
	): ActionRowBuilder<ButtonBuilder> | null {
		if (totalPages <= 1) return null;

		const navigationRow = new ActionRowBuilder<ButtonBuilder>();
		navigationRow.addComponents(
			new ButtonBuilder()
				.setCustomId("pager_prev")
				.setLabel(t("common.previous"))
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(currentPage === 0),
			new ButtonBuilder()
				.setCustomId("pager_next")
				.setLabel(t("common.next"))
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(currentPage === totalPages - 1),
		);
		return navigationRow;
	}
}
