import { LeBotClient } from "@class/LeBotClient";
import { Client } from "@decorators/Client";
import { Context } from "@decorators/Context";
import { EventController } from "@decorators/EventController";
import { On } from "@decorators/On";
import { BotEvents } from "@enums/BotEvents";
import { CommandService } from "@services/CommandService";
import type { ContextOf } from "@src/types/ContextOf";
import { Logger } from "@utils/Logger";
import {
	MessageFlags,
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

	@On(BotEvents.InteractionCreate)
	async run(
		@Client() client: LeBotClient<true>,
		@Context() [interaction]: ContextOf<typeof BotEvents.InteractionCreate>,
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
