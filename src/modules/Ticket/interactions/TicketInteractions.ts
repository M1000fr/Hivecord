import { ButtonPattern, ModalPattern } from "@decorators/Interaction";
import { InteractionHelper } from "@utils/InteractionHelper";
import {
	ActionRowBuilder,
	ButtonInteraction,
	ModalBuilder,
	ModalSubmitInteraction,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import { TicketService } from "../services/TicketService";

export class TicketInteractions {
	@ButtonPattern("ticket_create_btn:*")
	async handleCreateButton(interaction: ButtonInteraction) {
		const category = interaction.customId.split(":")[1];

		const modal = new ModalBuilder()
			.setCustomId(`ticket_create_modal:${category}`)
			.setTitle(`Create Ticket - ${category}`);

		const reasonInput = new TextInputBuilder()
			.setCustomId("ticket_reason")
			.setLabel("Reason for ticket")
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(true)
			.setMinLength(10)
			.setMaxLength(1000);

		const row = new ActionRowBuilder<TextInputBuilder>().addComponents(
			reasonInput,
		);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		modal.addComponents(row as any);

		await interaction.showModal(modal);
	}

	@ModalPattern("ticket_create_modal:*")
	async handleCreateModal(interaction: ModalSubmitInteraction) {
		const customId = interaction.customId;
		const category = customId.split(":")[1] || "Unknown";
		const reason = interaction.fields.getTextInputValue("ticket_reason");

		if (!interaction.guild) return;

		await InteractionHelper.defer(interaction, true);

		try {
			const channel = await TicketService.createTicket(
				interaction.guild,
				interaction.user.id,
				category,
				reason,
			);
			await InteractionHelper.respondSuccess(
				interaction,
				`Ticket created: ${channel}`,
			);
		} catch {
			await InteractionHelper.respondError(
				interaction,
				"Failed to create ticket.",
			);
		}
	}
}
