import { Events, type Interaction } from "discord.js";
import { BaseEvent } from '@class/BaseEvent';
import { Event } from '@decorators/Event';
import { LeBotClient } from '@class/LeBotClient';
import { InteractionRegistry } from '@services/InteractionRegistry';

@Event({
	name: Events.InteractionCreate,
})
export default class InteractionRegistryHandler extends BaseEvent<Events.InteractionCreate> {
	async run(client: LeBotClient<true>, interaction: Interaction) {
		if (interaction.isButton()) {
			const handler = InteractionRegistry.buttons.get(
				interaction.customId,
			);
			if (handler) await handler(interaction);
		} else if (interaction.isAnySelectMenu()) {
			const handler = InteractionRegistry.selectMenus.get(
				interaction.customId,
			);
			if (handler) await handler(interaction);
		} else if (interaction.isModalSubmit()) {
			const handler = InteractionRegistry.modals.get(
				interaction.customId,
			);
			if (handler) await handler(interaction);
		}
	}
}
