import {
	ApplicationCommandOptionType,
	type ApplicationCommandOptionData,
} from "discord.js";

export const warnOptions: ApplicationCommandOptionData[] = [
	{
		name: "user",
		description: "The user to warn",
		nameLocalizations: {
			fr: "utilisateur",
		},
		descriptionLocalizations: {
			fr: "L'utilisateur à avertir",
		},
		type: ApplicationCommandOptionType.User,
		required: true,
	},
	{
		name: "reason",
		description: "The reason for the warning",
		nameLocalizations: {
			fr: "raison",
		},
		descriptionLocalizations: {
			fr: "La raison de l'avertissement",
		},
		type: ApplicationCommandOptionType.String,
		required: true,
		autocomplete: true,
	},
];
