import { LeBotClient } from "@class/LeBotClient";
import { Client } from "@decorators/Client";
import { Event } from "@decorators/Event";
import { EventController } from "@decorators/EventController";
import { EventParam } from "@decorators/EventParam";
import { BotEvents } from "@enums/BotEvents";
import { InteractionRegistry } from "@registers/InteractionRegistry";
import { type Interaction } from "discord.js";

@EventController()
export default class InteractionRegistryHandler {
	@Event({
		name: BotEvents.InteractionCreate,
	})
	async run(
		@Client() client: LeBotClient<true>,
		@EventParam() interaction: Interaction,
	) {
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
