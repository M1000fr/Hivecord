import { BaseEvent } from "@class/BaseEvent";
import { LeBotClient } from "@class/LeBotClient";
import { Event } from "@decorators/Event";
import { BotEvents } from "@enums/BotEvents";
import { Logger } from "@utils/Logger";
import {
	MessageFlags,
	type Interaction,
	type InteractionReplyOptions,
	type RepliableInteraction,
} from "discord.js";

@Event({
	name: BotEvents.InteractionCreate,
})
export default class InteractionCreateEvent extends BaseEvent<
	typeof BotEvents.InteractionCreate
> {
	private logger = new Logger("InteractionCreateEvent");

	private async sendErrorResponse(
		interaction: RepliableInteraction,
		message: string,
	): Promise<void> {
		const payload: InteractionReplyOptions = {
			content: message,
			flags: [MessageFlags.Ephemeral],
		};
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp(payload);
		} else {
			await interaction.reply(payload);
		}
	}

	async run(client: LeBotClient<true>, interaction: Interaction) {
		if (interaction.isAutocomplete()) {
			const command = client.commands.get(interaction.commandName);
			if (!command) return;

			try {
				await command.instance.handleAutocomplete(client, interaction);
			} catch (error: unknown) {
				this.logger.error(
					`Error handling autocomplete for ${interaction.commandName}:`,
					error instanceof Error ? error.message : String(error),
				);
			}
			return;
		}

		if (!interaction.isChatInputCommand()) return;

		const command = client.commands.get(interaction.commandName);

		if (!command) {
			this.logger.error(
				`No command matching ${interaction.commandName} was found.`,
			);
			return;
		}

		try {
			await command.instance.execute(client, interaction);
		} catch (error) {
			this.logger.error(error);
			await this.sendErrorResponse(
				interaction,
				"There was an error while executing this command!",
			);
		}
	}
}
