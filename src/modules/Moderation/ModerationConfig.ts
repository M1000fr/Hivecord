import { ConfigProperty, EConfigType } from "@decorators/ConfigProperty";

export class ModerationConfig {
	@ConfigProperty({
		displayName: "Mute Role",
		displayNameLocalizations: {
			fr: "Rôle Muet",
		},
		description: "The role to give to muted users",
		descriptionLocalizations: {
			fr: "Le rôle à donner aux utilisateurs muets",
		},
		type: EConfigType.Role,
	})
	moderationMuteRoleId: string = "";
}
