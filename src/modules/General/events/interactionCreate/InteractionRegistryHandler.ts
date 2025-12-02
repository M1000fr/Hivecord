import { type Interaction } from "discord.js";
import { BaseEvent } from '@class/BaseEvent';
import { Event } from '@decorators/Event';
import { LeBotClient } from '@class/LeBotClient';
import { InteractionRegistry } from '@services/InteractionRegistry';
import { BotEvents } from "@enums/BotEvents";

@Event({
	name: BotEvents.InteractionCreate,
})
export default class InteractionRegistryHandler extends BaseEvent<typeof BotEvents.InteractionCreate> {
	async run(client: LeBotClient<true>, interaction: Interaction) {
		if (interaction.isButton()) {
			const handler = InteractionRegistry.getButtonHandler(
				interaction.customId,
			);
			if (handler) await handler(interaction);
		} else if (interaction.isAnySelectMenu()) {
			const handler = InteractionRegistry.getSelectMenuHandler(
				interaction.customId,
			);
			if (handler) await handler(interaction);
		} else if (interaction.isModalSubmit()) {
			const handler = InteractionRegistry.getModalHandler(
				interaction.customId,
			);
			if (handler) await handler(interaction);
		}
	}
}
