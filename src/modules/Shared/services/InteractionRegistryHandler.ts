import type { LeBotClient } from "@class/LeBotClient";
import { EventController } from "@decorators/EventController";
import { On } from "@decorators/On";
import { Client } from "@decorators/params/Client";
import { Context } from "@decorators/params/Context";
import { BotEvents } from "@enums/BotEvents";
import { InteractionRegistry } from "@registers/InteractionRegistry";
import type { ContextOf } from "@src/types/ContextOf.ts";

@EventController()
export default class InteractionRegistryHandler {
	@On(BotEvents.InteractionCreate)
	async run(
		@Client() client: LeBotClient<true>,
		@Context() [interaction]: ContextOf<typeof BotEvents.InteractionCreate>,
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
