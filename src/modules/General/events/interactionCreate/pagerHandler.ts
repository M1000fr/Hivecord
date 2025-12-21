import { LeBotClient } from "@class/LeBotClient";
import { Pager } from "@class/Pager";
import { Client } from "@decorators/Client";
import { Event } from "@decorators/Event";
import { EventController } from "@decorators/EventController";
import { EventParam } from "@decorators/EventParam";
import { BotEvents } from "@enums/BotEvents";
import { DiscordAPIError, type Interaction } from "discord.js";

@EventController()
export default class PagerHandlerEvent {
	@Event({
		name: BotEvents.InteractionCreate,
	})
	async run(
		@Client() client: LeBotClient<true>,
		@EventParam() interaction: Interaction,
	) {
		if (!interaction.isButton() && !interaction.isStringSelectMenu())
			return;

		// Try to handle as pager interaction
		// If it returns true, it was handled
		try {
			await Pager.handleInteraction(interaction);
		} catch (error: unknown) {
			// Ignore unknown interaction errors, as they might happen if the interaction was already handled
			if (
				error instanceof DiscordAPIError &&
				error.code !== 10062 &&
				error.code !== 40060
			) {
				console.error("Error handling pager interaction:", error);
			}
		}
	}
}
