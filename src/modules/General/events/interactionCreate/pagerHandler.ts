import { Events, type Interaction } from "discord.js";
import { BaseEvent } from '@class/BaseEvent';
import { Event } from '@decorators/Event';
import { LeBotClient } from '@class/LeBotClient';
import { Pager } from '@class/Pager';

@Event({
	name: Events.InteractionCreate,
})
export default class PagerHandlerEvent extends BaseEvent<Events.InteractionCreate> {
	async run(client: LeBotClient<true>, interaction: Interaction) {
		if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

		// Try to handle as pager interaction
		// If it returns true, it was handled
		try {
			await Pager.handleInteraction(interaction);
		} catch (error) {
			// Ignore unknown interaction errors, as they might happen if the interaction was already handled
			if ((error as any).code !== 10062 && (error as any).code !== 40060) {
				console.error("Error handling pager interaction:", error);
			}
		}
	}
}
