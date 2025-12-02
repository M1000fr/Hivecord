import { PagerRegistry } from "@services/PagerRegistry";
import { RedisService } from "@services/RedisService";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	EmbedBuilder,
	InteractionCollector,
	StringSelectMenuInteraction,
	type RepliableInteraction,
} from "discord.js";

export interface PagerOptions<T> {
	items: T[];
	itemsPerPage: number;
	renderPage?: (
		items: T[],
		pageIndex: number,
		totalPages: number,
	) => Promise<{ embeds: EmbedBuilder[]; components: any[]; files?: any[] }>;
	filter?: (interaction: any) => boolean;
	time?: number;
	onComponent?: (
		interaction: StringSelectMenuInteraction | ButtonInteraction,
		collector: InteractionCollector<any>,
	) => Promise<void>;
	type?: string; // Unique identifier for the pager type (required for persistence)
	userId?: string; // User ID allowed to interact (for persistence)
}

export class Pager<T> {
	private items: T[];
	private itemsPerPage: number;
	private currentPage: number = 0;
	private renderPage: (
		items: T[],
		pageIndex: number,
		totalPages: number,
	) => Promise<{ embeds: EmbedBuilder[]; components: any[]; files?: any[] }>;
	private filter: (interaction: any) => boolean;
	private time: number;
	private onComponent?: (
		interaction: StringSelectMenuInteraction | ButtonInteraction,
		collector: InteractionCollector<any>,
	) => Promise<void>;
	private type?: string;
	private userId?: string;

	constructor(options: PagerOptions<T>) {
		this.items = options.items;
		this.itemsPerPage = options.itemsPerPage;
		this.renderPage = options.renderPage!;
		this.filter = options.filter || (() => true);
		this.time = options.time || 300000; // 5 minutes default
		this.onComponent = options.onComponent;
		this.type = options.type;
		this.userId = options.userId;

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

			const navigationRow = new ActionRowBuilder<ButtonBuilder>();

			if (totalPages > 1) {
				navigationRow.addComponents(
					new ButtonBuilder()
						.setCustomId("pager_prev")
						.setLabel("Previous")
						.setStyle(ButtonStyle.Secondary)
						.setDisabled(this.currentPage === 0),
					new ButtonBuilder()
						.setCustomId("pager_next")
						.setLabel("Next")
						.setStyle(ButtonStyle.Secondary)
						.setDisabled(this.currentPage === totalPages - 1),
				);
				components.push(navigationRow);
			}

			return { embeds, components, files: files || [] };
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
			const redis = RedisService.getInstance();
			const state = {
				items: this.items,
				itemsPerPage: this.itemsPerPage,
				currentPage: this.currentPage,
				type: this.type,
				userId: this.userId,
				totalPages: totalPages,
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
					content:
						"❌ You are not allowed to interact with this pager.",
					flags: [64],
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
						i as StringSelectMenuInteraction | ButtonInteraction,
						collector,
					);
				}
			}
		});

		collector.on("end", () => {
			// Optional: Disable components on end
		});

		return collector;
	}

	static async handleInteraction(
		interaction: ButtonInteraction | StringSelectMenuInteraction,
	) {
		const redis = RedisService.getInstance();
		const key = `pager:${interaction.message.id}`;
		const data = await redis.get(key);

		if (!data) return false; // Not a pager interaction

		const state = JSON.parse(data);

		// Check ownership
		if (state.userId && interaction.user.id !== state.userId) {
			await interaction.reply({
				content: "❌ You are not allowed to interact with this pager.",
				flags: [64], // Ephemeral
			});
			return true;
		}

		const definition = PagerRegistry.get(state.type);
		if (!definition) {
			console.error(`Pager type ${state.type} not found in registry`);
			return false;
		}

		const totalPages = Math.ceil(state.items.length / state.itemsPerPage);

		if (interaction.customId === "pager_prev") {
			if (state.currentPage > 0) {
				state.currentPage--;
				await redis.set(key, JSON.stringify(state));
				await redis.expire(key, 3600);

				const start = state.currentPage * state.itemsPerPage;
				const end = start + state.itemsPerPage;
				const pageItems = state.items.slice(start, end);

				const { embeds, components, files } =
					await definition.renderPage(
						pageItems,
						state.currentPage,
						totalPages,
					);

				const navigationRow = new ActionRowBuilder<ButtonBuilder>();
				if (totalPages > 1) {
					navigationRow.addComponents(
						new ButtonBuilder()
							.setCustomId("pager_prev")
							.setLabel("Previous")
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(state.currentPage === 0),
						new ButtonBuilder()
							.setCustomId("pager_next")
							.setLabel("Next")
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(state.currentPage === totalPages - 1),
					);
					components.push(navigationRow);
				}

				await interaction.update({
					embeds,
					components,
					files: files || [],
				});
			} else {
				await interaction.deferUpdate();
			}
			return true;
		} else if (interaction.customId === "pager_next") {
			if (state.currentPage < totalPages - 1) {
				state.currentPage++;
				await redis.set(key, JSON.stringify(state));
				await redis.expire(key, 3600);

				const start = state.currentPage * state.itemsPerPage;
				const end = start + state.itemsPerPage;
				const pageItems = state.items.slice(start, end);

				const { embeds, components, files } =
					await definition.renderPage(
						pageItems,
						state.currentPage,
						totalPages,
					);

				const navigationRow = new ActionRowBuilder<ButtonBuilder>();
				if (totalPages > 1) {
					navigationRow.addComponents(
						new ButtonBuilder()
							.setCustomId("pager_prev")
							.setLabel("Previous")
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(state.currentPage === 0),
						new ButtonBuilder()
							.setCustomId("pager_next")
							.setLabel("Next")
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(state.currentPage === totalPages - 1),
					);
					components.push(navigationRow);
				}

				await interaction.update({
					embeds,
					components,
					files: files || [],
				});
			} else {
				await interaction.deferUpdate();
			}
			return true;
		} else {
			// Custom component
			if (definition.onComponent) {
				await definition.onComponent(
					interaction,
					state.items,
					state.currentPage,
				);
			}
			return true;
		}
	}
}
