import { BaseCommand } from "@class/BaseCommand";
import { LeBotClient } from "@class/LeBotClient";
import { Command } from "@decorators/Command";
import { EConfigType } from "@decorators/ConfigProperty";
import { DefaultCommand } from "@decorators/DefaultCommand";
import { ConfigHelper } from "@utils/ConfigHelper";
import { InteractionHelper } from "@utils/InteractionHelper";
import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
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
}
