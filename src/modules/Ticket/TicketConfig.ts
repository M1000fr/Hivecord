import { ConfigProperty, EConfigType } from "@decorators/ConfigProperty";

export class TicketConfig {
	@ConfigProperty({
		description: "The channel where the ticket creation panel will be sent",
		type: EConfigType.Channel,
	})
	createMessageChannel: string | null = null;

	@ConfigProperty({
		description: "Content of the ticket creation message",
		type: EConfigType.String,
		defaultValue: "Click below to create a ticket",
	})
	creationMessageContent: string = "Click below to create a ticket";

	@ConfigProperty({
		description: "Custom embed for the ticket creation message",
		type: EConfigType.CustomEmbed,
	})
	creationMessageEmbed: string | null = null;

	@ConfigProperty({
		description: "List of ticket categories",
		type: EConfigType.StringArray,
		defaultValue: ["Support", "Billing", "Other"],
	})
	ticketTypeCategory: string[] = ["Support", "Billing", "Other"];

	@ConfigProperty({
		description: "Category where ticket channels will be created",
		type: EConfigType.Channel,
	})
	ticketCreationCategory: string | null = null;
}
