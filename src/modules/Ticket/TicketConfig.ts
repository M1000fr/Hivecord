import { ConfigProperty, EConfigType } from "@decorators/ConfigProperty";

export class TicketConfig {
	@ConfigProperty({
		description: "The channel where the ticket creation panel will be sent",
		displayNameLocalizations: {
			fr: "Canal de création de ticket",
			"en-US": "Ticket Creation Channel",
		},
		descriptionLocalizations: {
			fr: "Le canal où le panneau de création de ticket sera envoyé",
			"en-US": "The channel where the ticket creation panel will be sent",
		},
		type: EConfigType.Channel,
	})
	createMessageChannel: string | null = null;

	@ConfigProperty({
		description: "The message to display for creating a ticket",
		descriptionLocalizations: {
			fr: "Le message à afficher pour créer un ticket",
			"en-US": "The message to display for creating a ticket",
		},
		displayNameLocalizations: {
			fr: "Message de création de ticket",
			"en-US": "Ticket Creation Message",
		},
		type: EConfigType.String,
		defaultValue: "Click below to create a ticket",
	})
	creationMessageContent: string = "Click below to create a ticket";

	@ConfigProperty({
		description: "Custom embed for the ticket creation message",
		descriptionLocalizations: {
			fr: "Embed personnalisé pour le message de création de ticket",
			"en-US": "Custom embed for the ticket creation message",
		},
		displayNameLocalizations: {
			fr: "Embed de création de ticket",
			"en-US": "Ticket Creation Embed",
		},
		type: EConfigType.CustomEmbed,
	})
	creationMessageEmbed: string | null = null;

	@ConfigProperty({
		description: "List of ticket categories",
		descriptionLocalizations: {
			fr: "Liste des catégories de ticket",
			"en-US": "List of ticket categories",
		},
		displayNameLocalizations: {
			fr: "Catégories de ticket",
			"en-US": "Ticket Categories",
		},
		type: EConfigType.StringArray,
		defaultValue: ["Support", "Billing", "Other"],
	})
	ticketTypeCategory: string[] = ["Support", "Billing", "Other"];

	@ConfigProperty({
		description: "Category where ticket channels will be created",
		descriptionLocalizations: {
			fr: "Catégorie où les canaux de ticket seront créés",
			"en-US": "Category where ticket channels will be created",
		},
		displayNameLocalizations: {
			fr: "Catégorie de création de ticket",
			"en-US": "Ticket Creation Category",
		},
		type: EConfigType.Channel,
	})
	ticketCreationCategory: string | null = null;

	@ConfigProperty({
		description: "Role that can manage tickets",
		descriptionLocalizations: {
			fr: "Rôle qui peut gérer les tickets",
			"en-US": "Role that can manage tickets",
		},
		displayNameLocalizations: {
			fr: "Rôle de support",
			"en-US": "Support Role",
		},
		type: EConfigType.Role,
	})
	supportRole: string | null = null;
}

export const TicketConfigKeys = {
	createMessageChannel: "createMessageChannel",
	creationMessageContent: "creationMessageContent",
	creationMessageEmbed: "creationMessageEmbed",
	ticketTypeCategory: "ticketTypeCategory",
	ticketCreationCategory: "ticketCreationCategory",
	supportRole: "supportRole",
};
