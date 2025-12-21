import { ConfigContext } from "@decorators/ConfigContext";
import { ConfigProperty } from "@decorators/ConfigProperty";
import { ModuleConfig } from "@decorators/ModuleConfig";
import { ConfigContextVariable } from "@enums/ConfigContextVariable";

@ModuleConfig()
export class GeneralConfig {
	@ConfigProperty({
		displayName: "Bot Language",
		displayNameLocalizations: {
			fr: "Langue du bot",
		},
		description: "The global language for the bot (e.g. en, fr)",
		descriptionLocalizations: {
			fr: "La langue globale du bot (ex: en, fr)",
		},
		type: "StringChoice",
		choices: [
			{
				name: "English",
				value: "en",
			},
			{
				name: "Français",
				value: "fr",
			},
		],
		nonNull: true,
	})
	generalLanguage: string = "en";

	@ConfigContext([
		ConfigContextVariable.User,
		ConfigContextVariable.Guild,
		ConfigContextVariable.Member,
		ConfigContextVariable.Invite,
	])
	@ConfigProperty({
		displayName: "Welcome Image Text",
		displayNameLocalizations: {
			fr: "Texte de l'image de bienvenue",
		},
		description: "The text to display on the welcome image",
		descriptionLocalizations: {
			fr: "Le texte à afficher sur l'image de bienvenue",
		},
		type: "String",
	})
	generalWelcomeMessageImage: string = "Welcome!";

	@ConfigContext([
		ConfigContextVariable.User,
		ConfigContextVariable.Guild,
		ConfigContextVariable.Member,
		ConfigContextVariable.Invite,
	])
	@ConfigProperty({
		displayName: "Welcome Message",
		displayNameLocalizations: {
			fr: "Message de bienvenue",
		},
		description: "The welcome message text",
		descriptionLocalizations: {
			fr: "Le texte du message de bienvenue",
		},
		type: "String",
	})
	generalWelcomeMessage: string = "Welcome {user} to {guild}!";

	@ConfigProperty({
		displayName: "Welcome Channel",
		displayNameLocalizations: {
			fr: "Salon de bienvenue",
		},
		description: "The channel to send welcome messages to",
		descriptionLocalizations: {
			fr: "Le salon où envoyer les messages de bienvenue",
		},
		type: "Channel",
	})
	generalWelcomeChannelId: string = "";

	@ConfigProperty({
		displayName: "Welcome Embed",
		displayNameLocalizations: {
			fr: "Embed de bienvenue",
		},
		description: "The name of the custom embed to use for welcome messages",
		descriptionLocalizations: {
			fr: "Le nom de l'embed personnalisé à utiliser",
		},
		type: "CustomEmbed",
	})
	generalWelcomeEmbedName: string = "";

	@ConfigProperty({
		displayName: "Welcome Roles",
		displayNameLocalizations: {
			fr: "Rôles de bienvenue",
		},
		description: "Roles to add to new members",
		descriptionLocalizations: {
			fr: "Rôles à ajouter aux nouveaux membres",
		},
		type: "RoleArray",
	})
	generalWelcomeRoles: string[] = [];

	@ConfigProperty({
		displayName: "Welcome Background",
		displayNameLocalizations: {
			fr: "Fond de bienvenue",
		},
		description: "The background image for the welcome card",
		descriptionLocalizations: {
			fr: "L'image de fond pour la carte de bienvenue",
		},
		type: "Attachment",
	})
	generalWelcomeBackground: string = "";
}
