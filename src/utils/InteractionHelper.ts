import {
	MessageFlags,
	type CommandInteraction,
	type InteractionReplyOptions,
	type InteractionUpdateOptions,
	type MessageComponentInteraction,
	type ModalSubmitInteraction,
} from "discord.js";

type RepliableInteraction =
	| CommandInteraction
	| MessageComponentInteraction
	| ModalSubmitInteraction;

/**
 * Helper utility for common Discord interaction patterns
 */
export class InteractionHelper {
	/**
	 * Send a response to an interaction, handling replied/deferred states
	 */
	static async respond(
		interaction: RepliableInteraction,
		payload: InteractionReplyOptions | InteractionUpdateOptions,
	): Promise<void> {
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp(payload as InteractionReplyOptions);
		} else if (interaction.isModalSubmit()) {
			await interaction.reply(payload as InteractionReplyOptions);
		} else if (interaction.isMessageComponent()) {
			await interaction.update(payload as InteractionUpdateOptions);
		} else {
			await interaction.reply(payload as InteractionReplyOptions);
		}
	}

	/**
	 * Send an error message to an interaction
	 */
	static async respondError(
		interaction: RepliableInteraction,
		error: string | Error,
	): Promise<void> {
		const message = error instanceof Error ? error.message : error;
		await this.respond(interaction, { content: `❌ ${message}` });
	}

	/**
	 * Send a success message to an interaction
	 */
	static async respondSuccess(
		interaction: RepliableInteraction,
		payload: InteractionReplyOptions | InteractionUpdateOptions,
	): Promise<void> {
		await this.respond(interaction, payload);
	}

	/**
	 * Defer the interaction reply or update based on interaction type
	 */
	static async defer(
		interaction: RepliableInteraction,
		ephemeral = false,
	): Promise<void> {
		if (interaction.deferred || interaction.replied) return;

		if (interaction.isMessageComponent() || interaction.isModalSubmit()) {
			await interaction.deferUpdate();
		} else {
			await interaction.deferReply({
				flags: ephemeral ? MessageFlags.Ephemeral : undefined,
			});
		}
	}
}
