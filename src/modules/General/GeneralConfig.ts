import {
	ConfigProperty,
	EConfigType,
	toConfigKey,
} from "@decorators/ConfigProperty";

export class GeneralConfig {
	@ConfigProperty({
		displayName: "Welcome Image Text",
		description: "The text to display on the welcome image",
		type: EConfigType.String,
		defaultValue: "Welcome!",
	})
	generalWelcomeMessageImage: string = "Welcome!";

	@ConfigProperty({
		displayName: "Welcome Message",
		description: "The welcome message text",
		type: EConfigType.String,
		defaultValue: "Welcome {user} to {guild}!",
	})
	generalWelcomeMessage: string = "Welcome {user} to {guild}!";

	@ConfigProperty({
		displayName: "Welcome Channel",
		description: "The channel to send welcome messages to",
		type: EConfigType.Channel,
	})
	generalWelcomeChannelId: string = "";

	@ConfigProperty({
		displayName: "Welcome Embed",
		description: "The name of the custom embed to use for welcome messages",
		type: EConfigType.CustomEmbed,
		defaultValue: "",
	})
	generalWelcomeEmbedName: string = "";

	@ConfigProperty({
		displayName: "Welcome Roles",
		description: "Roles to add to new members",
		type: EConfigType.RoleArray,
	})
	generalWelcomeRoles: string[] = [];

	@ConfigProperty({
		displayName: "Welcome Background",
		description: "The background image for the welcome card",
		type: EConfigType.Attachment,
	})
	generalWelcomeBackground: string = "";
}

export const GeneralConfigKeys = {
	get welcomeMessageImage() {
		return toConfigKey("generalWelcomeMessageImage");
	},
	get welcomeMessage() {
		return toConfigKey("generalWelcomeMessage");
	},
	get welcomeChannelId() {
		return toConfigKey("generalWelcomeChannelId");
	},
	get welcomeEmbedName() {
		return toConfigKey("generalWelcomeEmbedName");
	},
	get welcomeRoles() {
		return toConfigKey("generalWelcomeRoles");
	},
	get welcomeBackground() {
		return toConfigKey("generalWelcomeBackground");
	},
};
