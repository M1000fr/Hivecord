import { BaseCommand } from "@class/BaseCommand";
import { LeBotClient } from "@class/LeBotClient";
import { Autocomplete } from "@decorators/Autocomplete";
import { Command } from "@decorators/Command";
import { EConfigType } from "@decorators/ConfigProperty";
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
	options: [
		{
			name: "panel",
			description: "Update or send the ticket creation panel",
			type: ApplicationCommandOptionType.Subcommand,
		},
		{
			name: "close",
			description: "Close a ticket by ID",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "id",
					description: "The ID of the ticket to close",
					type: ApplicationCommandOptionType.String,
					required: true,
					autocomplete: true,
				},
			],
		},
	],
})
export class TicketCommand extends BaseCommand {
	@Subcommand({ name: "panel" })
	async panel(client: LeBotClient, interaction: ChatInputCommandInteraction) {
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

	@Subcommand({ name: "close" })
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
		} catch {
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

		if (!guildId) {
			await interaction.respond([]);
			return;
		}

		const id = parseInt(focusedValue);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const orConditions: any[] = [
			{
				Creator: {
					id: {
						contains: focusedValue,
					},
				},
			},
		];

		if (!isNaN(id)) {
			orConditions.push({
				id: {
					equals: id,
				},
			});
		}

		const tickets = await prismaClient.ticket.findMany({
			where: {
				guildId: guildId,
				active: true,
				OR: orConditions,
			},
			take: 25,
			include: {
				Creator: true,
			},
		});

		await interaction.respond(
			tickets.map((ticket) => ({
				name: `Ticket #${ticket.id} - ${ticket.Creator?.id || "Unknown"}`,
				value: ticket.id.toString(),
			})),
		);
	}
}
