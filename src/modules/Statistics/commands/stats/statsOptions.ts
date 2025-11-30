import type { CommandOptions } from "@interfaces/CommandOptions";
import { ApplicationCommandOptionType } from "discord.js";

// Subcommand-based definition:
// /stats server period
// /stats user user period
// /stats me period
export const statsOptions: CommandOptions = {
	name: "stats",
	description: "Afficher les statistiques d'activité",
	options: [
		{
			name: "server",
			description: "Statistiques globales du serveur",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "period",
					description: "Période (24h, 7d, 30d)",
					type: ApplicationCommandOptionType.String,
					required: false,
					choices: [
						{ name: "24 heures", value: "24h" },
						{ name: "7 jours", value: "7d" },
						{ name: "30 jours", value: "30d" },
					],
				},
			],
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
				{
					name: "period",
					description: "Période (24h, 7d, 30d)",
					type: ApplicationCommandOptionType.String,
					required: false,
					choices: [
						{ name: "24 heures", value: "24h" },
						{ name: "7 jours", value: "7d" },
						{ name: "30 jours", value: "30d" },
					],
				},
			],
		},
		{
			name: "me",
			description: "Vos propres statistiques",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "period",
					description: "Période (24h, 7d, 30d)",
					type: ApplicationCommandOptionType.String,
					required: false,
					choices: [
						{ name: "24 heures", value: "24h" },
						{ name: "7 jours", value: "7d" },
						{ name: "30 jours", value: "30d" },
					],
				},
			],
		},
	],
};
