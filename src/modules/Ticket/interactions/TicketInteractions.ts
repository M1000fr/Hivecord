import { EConfigType } from "@decorators/ConfigProperty";
import { ButtonPattern, ModalPattern } from "@decorators/Interaction";
import { ConfigHelper } from "@utils/ConfigHelper";
import { InteractionHelper } from "@utils/InteractionHelper";
import {
	ButtonInteraction,
	GuildMember,
	LabelBuilder,
	ModalBuilder,
	ModalSubmitInteraction,
	PermissionFlagsBits,
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

		modal.addLabelComponents(
			new LabelBuilder()
				.setLabel("Reason for ticket")
				.setTextInputComponent(
					new TextInputBuilder()
						.setCustomId("ticket_reason")
						.setStyle(TextInputStyle.Paragraph)
						.setRequired(true)
						.setMinLength(10)
						.setMaxLength(1000),
				),
		);

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
			await InteractionHelper.respond(interaction, {
				content: `Ticket created successfully: <#${channel.id}>`,
			});
		} catch (error) {
			console.error("Error creating ticket:", error);
			await InteractionHelper.respond(interaction, {
				content: "Failed to create ticket. Please try again later.",
			});
		}
	}

	@ButtonPattern("ticket_close")
	async handleCloseButton(interaction: ButtonInteraction) {
		if (!interaction.guild) return;

		await InteractionHelper.defer(interaction, true);

		const member = interaction.member as GuildMember;
		const supportRole = await ConfigHelper.fetchValue(
			interaction.guild.id,
			"supportRole",
			EConfigType.Role,
		);

		const hasPermission =
			member.permissions.has(PermissionFlagsBits.Administrator) ||
			(supportRole && member.roles.cache.has(supportRole as string));

		if (!hasPermission) {
			await InteractionHelper.respond(interaction, {
				content: "You do not have permission to close this ticket.",
			});
			return;
		}

		await TicketService.closeTicket(interaction.channelId);
	}
}
