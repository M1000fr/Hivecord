import type { CommandOptions } from "@interfaces/CommandOptions";
import { ApplicationCommandOptionType } from "discord.js";

export const banOptions: CommandOptions = {
	name: "ban",
	description: "Ban a user",
	nameLocalizations: {
		fr: "bannir",
	},
	descriptionLocalizations: {
		fr: "Bannir un utilisateur",
	},
	options: [
		{
			name: "user",
			description: "The user to ban",
			nameLocalizations: {
				fr: "utilisateur",
			},
			descriptionLocalizations: {
				fr: "L'utilisateur à bannir",
			},
			type: ApplicationCommandOptionType.User,
			required: true,
		},
		{
			name: "reason",
			description: "Reason for the ban",
			nameLocalizations: {
				fr: "raison",
			},
			descriptionLocalizations: {
				fr: "Raison du bannissement",
			},
			type: ApplicationCommandOptionType.String,
			required: false,
			autocomplete: true,
		},
		{
			name: "delete_messages",
			description: "Delete messages from the last X days (0-7)",
			nameLocalizations: {
				fr: "supprimer_messages",
			},
			descriptionLocalizations: {
				fr: "Supprimer les messages des X derniers jours (0-7)",
			},
			type: ApplicationCommandOptionType.Integer,
			required: false,
			minValue: 0,
			maxValue: 7,
		},
	],
};
