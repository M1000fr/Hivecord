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
	renderPage: (
		items: T[],
		pageIndex: number,
		totalPages: number,
	) => Promise<{ embeds: EmbedBuilder[]; components: any[] }>;
	filter?: (interaction: any) => boolean;
	time?: number;
	onComponent?: (
		interaction: StringSelectMenuInteraction | ButtonInteraction,
		collector: InteractionCollector<any>,
	) => Promise<void>;
}

export class Pager<T> {
	private items: T[];
	private itemsPerPage: number;
	private currentPage: number = 0;
	private renderPage: (
		items: T[],
		pageIndex: number,
		totalPages: number,
	) => Promise<{ embeds: EmbedBuilder[]; components: any[] }>;
	private filter: (interaction: any) => boolean;
	private time: number;
	private onComponent?: (
		interaction: StringSelectMenuInteraction | ButtonInteraction,
		collector: InteractionCollector<any>,
	) => Promise<void>;

	constructor(options: PagerOptions<T>) {
		this.items = options.items;
		this.itemsPerPage = options.itemsPerPage;
		this.renderPage = options.renderPage;
		this.filter = options.filter || (() => true);
		this.time = options.time || 300000; // 5 minutes default
		this.onComponent = options.onComponent;
	}

	public async start(interaction: RepliableInteraction) {
		const totalPages = Math.ceil(this.items.length / this.itemsPerPage);

		const getPageContent = async () => {
			const start = this.currentPage * this.itemsPerPage;
			const end = start + this.itemsPerPage;
			const pageItems = this.items.slice(start, end);

			const { embeds, components } = await this.renderPage(
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

			return { embeds, components };
		};

		const initialContent = await getPageContent();

		let message;
		if (interaction.deferred || interaction.replied) {
			message = await interaction.editReply(initialContent);
		} else {
			await interaction.reply(initialContent);
			message = await interaction.fetchReply();
		}

		const collector = message.createMessageComponentCollector({
			filter: this.filter,
			time: this.time,
		});

		collector.on("collect", async (i) => {
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
					// After custom component action, we might want to refresh the page
					// But the onComponent handler should decide if it updates or not.
					// If onComponent updates the message, we are good.
					// If onComponent opens a modal, it shouldn't update the message immediately.
				}
			}
		});

		collector.on("end", () => {
			// Optional: Disable components on end
		});

		return collector;
	}
}
