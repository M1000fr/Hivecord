import { BaseCommand } from "@class/BaseCommand";
import { LeBotClient } from "@class/LeBotClient";
import { Autocomplete } from "@decorators/Autocomplete";
import { Command } from "@decorators/Command";
import { EConfigType } from "@decorators/ConfigProperty";
import { DefaultCommand } from "@decorators/DefaultCommand";
import { Subcommand } from "@decorators/Subcommand";
import { prismaClient } from "@services/prismaService";
import { ConfigHelper } from "@utils/ConfigHelper";
import { InteractionHelper } from "@utils/InteractionHelper";
import {
	ApplicationCommandOptionType,
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	PermissionFlagsBits,
} from "discord.js";
import { TicketService } from "../services/TicketService";

@Command({
	name: "ticket",
	description: "Manage tickets",
	defaultMemberPermissions: PermissionFlagsBits.Administrator,
})
export class TicketCommand extends BaseCommand {
	@DefaultCommand()
	async run(client: LeBotClient, interaction: ChatInputCommandInteraction) {
		if (!interaction.guildId) return;

		await InteractionHelper.defer(interaction);

		const channelId = await ConfigHelper.fetchValue(
			interaction.guildId,
			"createMessageChannel",
			EConfigType.Channel,
		);
		if (!channelId) {
			await InteractionHelper.respondError(
				interaction,
				"Ticket creation channel is not configured. Please configure 'createMessageChannel' first.",
			);
			return;
		}

		await TicketService.updateCreationMessage(interaction.guildId);
		await InteractionHelper.respondSuccess(
			interaction,
			"Ticket creation message updated.",
		);
	}

	@Subcommand({
		name: "close",
		description: "Close a ticket by ID",
		options: [
			{
				name: "id",
				description: "The ID of the ticket to close",
				type: ApplicationCommandOptionType.String,
				required: true,
				autocomplete: true,
			},
		],
	})
	async close(client: LeBotClient, interaction: ChatInputCommandInteraction) {
		const ticketId = interaction.options.getString("id", true);

		await InteractionHelper.defer(interaction);

		try {
			const ticket = await prismaClient.ticket.findFirst({
				where: {
					id: parseInt(ticketId),
					guildId: interaction.guildId!,
				},
			});

			if (!ticket) {
				await InteractionHelper.respondError(
					interaction,
					"Ticket not found.",
				);
				return;
			}

			await TicketService.closeTicket(ticket.channelId);
			await InteractionHelper.respondSuccess(
				interaction,
				`Ticket #${ticketId} closed.`,
			);
		} catch (error) {
			await InteractionHelper.respondError(
				interaction,
				"Failed to close ticket.",
			);
		}
	}

	@Autocomplete({ optionName: "id" })
	async autocompleteTicketId(
		client: LeBotClient,
		interaction: AutocompleteInteraction,
	) {
		const focusedValue = interaction.options.getFocused();
		const guildId = interaction.guildId;

		if (!guildId) return [];

		const tickets = await prismaClient.ticket.findMany({
			where: {
				guildId: guildId,
				active: true,
				OR: [
					{
						id: {
							equals: parseInt(focusedValue) || undefined,
						},
					},
					{
						Creator: {
							id: {
								contains: focusedValue,
							},
						},
					},
				],
			},
			take: 25,
			include: {
				Creator: true,
			},
		});

		return tickets.map((ticket) => ({
			name: `Ticket #${ticket.id} - ${ticket.Creator?.id || "Unknown"}`,
			value: ticket.id.toString(),
		}));
	}
}
