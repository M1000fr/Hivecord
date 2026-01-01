import { ConfigContext } from "@decorators/ConfigContext";
import {
	ConfigProperty,
	EConfigType,
	configKey,
} from "@decorators/ConfigProperty";
import { ModuleConfig } from "@decorators/ModuleConfig";
import { ConfigContextVariable } from "@enums/ConfigContextVariable";
import { CUSTOM_EMBED_CONFIG_KEY } from "../CustomEmbed/CustomEmbedConfigKey";

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
		type: EConfigType.StringChoice,
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
	static Language = configKey("fr");

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
		type: EConfigType.String,
	})
	static WelcomeMessageImage = configKey("Welcome!");

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
		type: EConfigType.String,
	})
	static WelcomeMessage = configKey("Welcome {user} to {guild}!");

	@ConfigProperty({
		displayName: "Welcome Channel",
		displayNameLocalizations: {
			fr: "Salon de bienvenue",
		},
		description: "The channel to send welcome messages to",
		descriptionLocalizations: {
			fr: "Le salon où envoyer les messages de bienvenue",
		},
		type: EConfigType.Channel,
	})
	static WelcomeChannelId = configKey("");

	@ConfigProperty({
		displayName: "Welcome Embed",
		displayNameLocalizations: {
			fr: "Embed de bienvenue",
		},
		description: "The name of the custom embed to use for welcome messages",
		descriptionLocalizations: {
			fr: "Le nom de l'embed personnalisé à utiliser",
		},
		type: CUSTOM_EMBED_CONFIG_KEY,
	})
	static WelcomeEmbedName = configKey("");

	@ConfigProperty({
		displayName: "Welcome Roles",
		displayNameLocalizations: {
			fr: "Rôles de bienvenue",
		},
		description: "Roles to add to new members",
		descriptionLocalizations: {
			fr: "Rôles à ajouter aux nouveaux membres",
		},
		type: EConfigType.RoleArray,
	})
	static WelcomeRoles = configKey<string[]>([]);

	@ConfigProperty({
		displayName: "Welcome Background",
		displayNameLocalizations: {
			fr: "Fond de bienvenue",
		},
		description: "The background image for the welcome card",
		descriptionLocalizations: {
			fr: "L'image de fond pour la carte de bienvenue",
		},
		type: EConfigType.Attachment,
	})
	static WelcomeBackground = configKey("");

	// Instance properties for ConfigProxy compatibility
	Language!: string;
	WelcomeMessageImage!: string;
	WelcomeMessage!: string;
	WelcomeChannelId!: string;
	WelcomeEmbedName!: string;
	WelcomeRoles!: string[];
	WelcomeBackground!: string;
}
