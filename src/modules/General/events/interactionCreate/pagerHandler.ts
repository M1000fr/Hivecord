import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Pager } from "@class/Pager";
import { Event } from "@decorators/Event";
import { BotEvents } from "@enums/BotEvents";
import { DiscordAPIError, type Interaction } from "discord.js";

@Event({
	name: BotEvents.InteractionCreate,
})
export default class PagerHandlerEvent extends BaseEvent<
	typeof BotEvents.InteractionCreate
> {
	async run(client: LeBotClient<true>, interaction: Interaction) {
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
