import type { CommandOptions } from "@interfaces/CommandOptions";
import {
	ApplicationCommandOptionType,
	InteractionContextType,
} from "discord.js";

export const clearOptions: CommandOptions = {
	name: "clear",
	description: "Clear messages in a channel",
	nameLocalizations: {
		fr: "effacer",
	},
	descriptionLocalizations: {
		fr: "Effacer des messages dans un salon",
	},
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "amount",
			type: ApplicationCommandOptionType.String,
			description: "Number of messages to clear",
			nameLocalizations: {
				fr: "nombre",
			},
			descriptionLocalizations: {
				fr: "Nombre de messages à effacer",
			},
			required: true,
		},
		{
			name: "user",
			type: ApplicationCommandOptionType.User,
			description: "User whose messages to clear",
			nameLocalizations: {
				fr: "utilisateur",
			},
			descriptionLocalizations: {
				fr: "Utilisateur dont les messages doivent être effacés",
			},
			required: false,
		},
	],
};
