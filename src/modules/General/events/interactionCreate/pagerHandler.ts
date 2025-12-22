import { LeBotClient } from "@class/LeBotClient";
import { EventController } from "@decorators/EventController";
import { Inject } from "@decorators/Inject";
import { On } from "@decorators/On";
import { Client } from "@decorators/params/Client";
import { Context } from "@decorators/params/Context";
import { BotEvents } from "@enums/BotEvents";
import { PagerService } from "@modules/Core/services/PagerService";
import type { ContextOf } from "@src/types/ContextOf.ts";
import { DiscordAPIError } from "discord.js";

@EventController()
export default class PagerHandlerEvent {
	constructor(@Inject(PagerService) private pagerService: PagerService) {}

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
			await this.pagerService.handleInteraction(interaction);
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
