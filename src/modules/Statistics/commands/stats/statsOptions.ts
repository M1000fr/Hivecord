import type { CommandOptions } from "@interfaces/CommandOptions";
import {
	ApplicationCommandOptionType,
	InteractionContextType,
} from "discord.js";

// Subcommand-based definition without period option (handled by buttons)
export const statsOptions: CommandOptions = {
	name: "stats",
	description: "Afficher les statistiques d'activité",
	contexts: [InteractionContextType.Guild],
	options: [
		{
			name: "server",
			description: "Statistiques globales du serveur",
			type: ApplicationCommandOptionType.Subcommand,
		},
		{
			name: "user",
			description: "Statistiques d'un utilisateur",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "target",
					description: "Utilisateur ciblé",
					type: ApplicationCommandOptionType.User,
					required: true,
				},
			],
		},
		{
			name: "me",
			description: "Vos propres statistiques",
			type: ApplicationCommandOptionType.Subcommand,
		},
	],
};
