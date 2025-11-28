import { MessageFlags } from "discord.js";

/**
 * Helper utility for common Discord interaction patterns
 */
export class InteractionHelper {
	/**
	 * Send a response to an interaction, handling replied/deferred states
	 */
	static async respond(
		interaction: any,
		content: string,
		ephemeral = true
	): Promise<void> {
		const payload = { content, flags: ephemeral ? [MessageFlags.Ephemeral] : [] };
		
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp(payload);
		} else if (interaction.isModalSubmit?.()) {
			await interaction.reply(payload);
		} else if (interaction.update) {
			await interaction.update({ ...payload, embeds: [], components: [] });
		} else {
			await interaction.reply(payload);
		}
	}

	/**
	 * Send an error message to an interaction
	 */
	static async respondError(
		interaction: any,
		error: string | Error
	): Promise<void> {
		const message = error instanceof Error ? error.message : error;
		await this.respond(interaction, `❌ ${message}`, true);
	}

	/**
	 * Send a success message to an interaction
	 */
	static async respondSuccess(
		interaction: any,
		message: string
	): Promise<void> {
		await this.respond(interaction, `✅ ${message}`, true);
	}

	/**
	 * Defer the interaction reply or update based on interaction type
	 */
	static async defer(interaction: any, ephemeral = true): Promise<void> {
		if (interaction.deferred || interaction.replied) return;

		const options = ephemeral ? { flags: [MessageFlags.Ephemeral] } : {};
		
		if (interaction.deferUpdate) {
			await interaction.deferUpdate();
		} else if (interaction.deferReply) {
			await interaction.deferReply(options);
		}
	}
}
