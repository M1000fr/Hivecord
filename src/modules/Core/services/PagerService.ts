import { Pager, type PagerOptions } from "@class/Pager";
import { Injectable } from "@decorators/Injectable";
import { I18nService } from "@modules/Core/services/I18nService";
import { RedisService } from "@modules/Core/services/RedisService";
import { PagerRegistry } from "@registers/PagerRegistry";
import { ButtonInteraction, StringSelectMenuInteraction } from "discord.js";

@Injectable()
export class PagerService {
	constructor(private readonly redisService: RedisService) {}

	/**
	 * Create a new Pager instance with injected dependencies
	 */
	create<T>(options: PagerOptions<T>): Pager<T> {
		return new Pager(options, this.redisService);
	}

	/**
	 * Handle pager button interactions from Redis-persisted state
	 */
	async handleInteraction(
		interaction: ButtonInteraction | StringSelectMenuInteraction,
	): Promise<boolean> {
		const redis = this.redisService.client;
		const key = `pager:${interaction.message.id}`;

		const data = await redis.get(key);

		if (!data) return false; // Not a pager interaction

		const state = JSON.parse(data);
		const locale = state.locale || "fr";
		const t = I18nService.getFixedT(locale);

		// Check ownership
		if (state.userId && interaction.user.id !== state.userId) {
			await interaction.reply({
				content: t("utils.pager.not_allowed"),
				ephemeral: true,
			});
			return false;
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

				const navigationRow = Pager.createNavigationRow(
					state.currentPage,
					totalPages,
					t,
				);
				if (navigationRow) {
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

				const navigationRow = Pager.createNavigationRow(
					state.currentPage,
					totalPages,
					t,
				);
				if (navigationRow) {
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
