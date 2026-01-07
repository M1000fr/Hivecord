import type { LeBotClient } from "@class/LeBotClient";
import { EventController } from "@decorators/EventController";
import { On } from "@decorators/On";
import { Client } from "@decorators/params/Client";
import { Context } from "@decorators/params/Context";
import { BotEvents } from "@enums/BotEvents";
import type { CommandService } from "@modules/Shared/services/CommandService";
import type { ContextOf } from "@src/types/ContextOf.ts";
import { Logger } from "@utils/Logger";
import {
	type InteractionReplyOptions,
	MessageFlags,
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

		if (interaction.isChatInputCommand()) {
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
			return;
		}

		if (
			interaction.isUserContextMenuCommand() ||
			interaction.isMessageContextMenuCommand()
		) {
			const command = client.commands.get(interaction.commandName);

			if (!command) {
				this.logger.error(
					`No context menu command matching ${interaction.commandName} was found.`,
				);
				return;
			}

			try {
				await this.commandService.executeContextMenu(
					client,
					interaction,
					command.instance,
				);
			} catch (error) {
				this.logger.error(error);
				await this.sendErrorResponse(
					interaction,
					"There was an error while executing this context menu command!",
				);
			}
			return;
		}
	}
}
