import { LeBotClient } from "@class/LeBotClient";
import { Pager } from "@class/Pager";
import { EventController } from "@decorators/EventController";
import { On } from "@decorators/On";
import { Client } from "@decorators/params/Client";
import { Context } from "@decorators/params/Context";
import { BotEvents } from "@enums/BotEvents";
import type { ContextOf } from "@src/types/ContextOf.ts";
import { DiscordAPIError } from "discord.js";

@EventController()
export default class PagerHandlerEvent {
	@On(BotEvents.InteractionCreate)
	async run(
		@Client() client: LeBotClient<true>,
		@Context() [interaction]: ContextOf<typeof BotEvents.InteractionCreate>,
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
