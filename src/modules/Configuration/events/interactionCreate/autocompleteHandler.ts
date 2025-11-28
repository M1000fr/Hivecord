import { Events, type Interaction } from "discord.js";
import { BaseEvent } from '@class/BaseEvent';
import { Event } from '@decorators/Event';
import { LeBotClient } from '@class/LeBotClient';

@Event({
	name: Events.InteractionCreate,
})
export default class AutocompleteHandlerEvent extends BaseEvent<Events.InteractionCreate> {
	async run(client: LeBotClient<true>, interaction: Interaction) {
		if (!interaction.isAutocomplete()) return;

		const command = client.commands.get(interaction.commandName);
		if (!command) return;

		try {
			// Handle autocomplete for modules command
			if (interaction.commandName === "modules") {
				const focusedValue = interaction.options.getFocused().toLowerCase();

				const modules = Array.from(client.modules.values())
					.filter((m) => m.options.config) // Only show modules with config
					.filter((m) =>
						m.options.name.toLowerCase().includes(focusedValue),
					)
					.map((m) => ({
						name: m.options.name,
						value: m.options.name.toLowerCase(),
					}))
					.slice(0, 25); // Discord limit

				await interaction.respond(modules);
			}
		} catch (error) {
			console.error(error);
		}
	}
}
