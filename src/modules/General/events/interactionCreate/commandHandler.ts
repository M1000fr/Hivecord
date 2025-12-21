import { LeBotClient } from "@class/LeBotClient";
import { Client } from "@decorators/Client";
import { Event } from "@decorators/Event";
import { EventController } from "@decorators/EventController";
import { EventParam } from "@decorators/EventParam";
import { BotEvents } from "@enums/BotEvents";
import { CommandService } from "@services/CommandService";
import { Logger } from "@utils/Logger";
import {
	MessageFlags,
	type Interaction,
	type InteractionReplyOptions,
	type RepliableInteraction,
} from "discord.js";

@EventController()
export default class InteractionCreateEvent {
	private logger = new Logger("InteractionCreateEvent");

	constructor(private readonly commandService: CommandService) {}

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

	@Event({
		name: BotEvents.InteractionCreate,
	})
	async run(
		@Client() client: LeBotClient<true>,
		@EventParam() interaction: Interaction,
	) {
		if (interaction.isAutocomplete()) {
			const command = client.commands.get(interaction.commandName);
			if (!command) return;

			try {
				await this.commandService.handleAutocomplete(
					client,
					interaction,
					command.instance,
				);
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
			await this.commandService.execute(
				client,
				interaction,
				command.instance,
			);
		} catch (error) {
			this.logger.error(error);
			await this.sendErrorResponse(
				interaction,
				"There was an error while executing this command!",
			);
		}
	}
}
